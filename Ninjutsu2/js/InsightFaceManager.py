import datetime
import cv2
import insightface
import numpy as np
import threading
import gc
import atexit

from FaceDetectionResult import FaceDetectionResult
from FPSCounter import FPSCounter
from CameraIntrinsicsClass import CameraIntrinsicsClass
from DistanceEstimator import DistanceEstimator


class InsightFaceManager:
    def __init__(self, device_index=0, input_size=None, use_cuda=True, pixel_format=None):
        self.device_index = device_index
        self.device_width = 640
        self.device_height = 480
        self.input_size = input_size
        self.pixel_format = pixel_format

        self.fps_counter = FPSCounter()
        self.camera_intrinsics = CameraIntrinsicsClass()
        self.distance_estimator = DistanceEstimator(self.camera_intrinsics, (self.device_width, self.device_height))
        if self.input_size is not None:
            self.distance_estimator.set_size(self.input_size)

        providers = ['CUDAExecutionProvider', 'CPUExecutionProvider'] if use_cuda else ['CPUExecutionProvider']
        self.detector = insightface.app.FaceAnalysis(providers=providers)
        # GPUを使う時はctx_id=0, CPUのみなら-1
        self.detector.prepare(ctx_id=0 if use_cuda else -1)

        self.run_in_thread = False
        self.flip_mode = None
        self._on_face_detection_callback = None

        self._stop_event = threading.Event()
        self._thread = None
        self._cap = None
        self._window_name = 'Insight Face Detection'
        atexit.register(self._cleanup)

    # ---- public API ----
    def start(self):
        if self.run_in_thread:
            self._thread = threading.Thread(target=self._detect_face_loop, daemon=True)
            self._thread.start()
        else:
            self._detect_face_loop()

    def stop(self):
        self._stop_event.set()
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2.0)
        self._cleanup()

    def set_device_index(self, value):
        self.device_index = value
    def set_device_width(self, value):
        self.device_width = value
    def set_device_height(self, value):
        self.device_height = value
    def set_input_size(self, value):
        self.input_size = value
        self.distance_estimator.set_size(self.input_size)
    def set_pixel_format(self, value):
        self.pixel_format = value

    def set_flip_mode(self, value):
        # 0:上下, 1:左右, -1:両方, None:反転なし
        self.flip_mode = value

    # ---- internals ----
    def _open_capture(self):
        self._cap = cv2.VideoCapture(self.device_index, cv2.CAP_DSHOW)# NV12 を指定
        self._cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.device_width)
        self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.device_height)
        if self.pixel_format is not None:
            #fourcc = cv2.VideoWriter_fourcc('N', 'V', '1', '2')
            fourcc = cv2.VideoWriter_fourcc(*self.pixel_format)
            #最後に指定
            self._cap.set(cv2.CAP_PROP_FOURCC, fourcc)
        #print("要求FOURCC:", fourcc)
        #print("実際のFOURCC:", self._cap.get(cv2.CAP_PROP_FOURCC))
        #print("実際のwitdh:", self._cap.get(cv2.CAP_PROP_FRAME_WIDTH), " <- ", self.device_width)
        #print("実際のheight:", self._cap.get(cv2.CAP_PROP_FRAME_HEIGHT), " <- ", self.device_height)


    def _cleanup(self):
        # ウィンドウ/キャプチャの確実な解放
        try:
            if self._cap is not None:
                self._cap.release()
                self._cap = None
        except Exception:
            pass
        try:
            cv2.destroyAllWindows()
        except Exception:
            pass
        # detectorはプロセス終了までGPUメモリを掴み続けることがあるので明示的に破棄
        try:
            del self.detector
        except Exception:
            pass
        gc.collect()

    def _detect_face_loop(self):
        try:
            self._open_capture()
            if not self._cap or not self._cap.isOpened():
                print("Failed to open camera.")
                return

            #fourcc_int = int(self._cap.get(cv2.CAP_PROP_FOURCC))
            #fourcc = list((fourcc_int.to_bytes(4, 'little').decode('utf-8')))

            # 再利用する一時オブジェクト
            face_detection_result = FaceDetectionResult()

            cv2.namedWindow(self._window_name, cv2.WINDOW_NORMAL)

            while not self._stop_event.is_set():
                ok, image = self._cap.read()
                if not ok:
                    continue
                if self.input_size is not None:
                    image = cv2.resize(image, self.input_size)

                # RGBへ（flip含む）
                if self.flip_mode is None:
                    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                else:
                    rgb = cv2.cvtColor(cv2.flip(image, self.flip_mode), cv2.COLOR_BGR2RGB)

                # 検出
                faces = self.detector.get(rgb)

                # 距離計算（属性追加は最小限に）
                distances = []
                for face in faces:
                    d = self.distance_estimator.estimate_distance_hfov(face.bbox, face.sex, face.age)
                    face["distance"] = d
                    distances.append(d)

                # Callback（必要時のみJSON生成）
                if self._on_face_detection_callback is not None:
                    face_data = face_detection_result.export_json_data_insight_face(
                        faces, self.device_width, self.device_height
                    )
                    self._on_face_detection_callback(face_data)

                # 描画
                bgr = image  # 元がBGR
                for face, dist in zip(faces, distances):
                    x1, y1, x2, y2 = face.bbox.astype(np.int32)
                    cv2.rectangle(bgr, (x1, y1), (x2, y2), (0, 255, 0), 2)

                    if face.landmark_2d_106 is not None:
                        lm = face.landmark_2d_106.astype(np.int32)
                        cv2.circle(bgr, tuple(lm[88]), 1, (0, 0, 255), -1)  # left eye
                        cv2.circle(bgr, tuple(lm[86]), 1, (0, 0, 255), -1)  # nose top
                        cv2.circle(bgr, tuple(lm[38]), 1, (0, 0, 255), -1)  # right eye

                    cv2.putText(bgr, f'Gender:{face.sex}, Age{face.age}', (int(x1), int(y1 - 5)),
                                cv2.FONT_HERSHEY_PLAIN, 1, (0, 255, 0), 2, cv2.LINE_AA)

                    if dist is not None:
                        cv2.putText(bgr, f'Distance:{dist:.2f}', (int(x1), int(y2 + 15)),
                                    cv2.FONT_HERSHEY_PLAIN, 1, (0, 255, 0), 2, cv2.LINE_AA)
                    else:
                        cv2.putText(bgr, 'Distance:None', (int(x1), int(y2 + 15)),
                                    cv2.FONT_HERSHEY_PLAIN, 1, (0, 255, 0), 2, cv2.LINE_AA)

                # FPS, Count
                self.fps_counter.update()
                cv2.putText(bgr, f'FPS:{self.fps_counter.fps:.2f}', (0, 40),
                            cv2.FONT_HERSHEY_PLAIN, 2, (0, 255, 0), 2, cv2.LINE_AA)
                cv2.putText(bgr, f'Count:{len(faces)}', (0, 80),
                            cv2.FONT_HERSHEY_PLAIN, 2, (0, 255, 0), 2, cv2.LINE_AA)

                cv2.imshow(self._window_name, bgr)
                key = cv2.waitKey(1) & 0xff
                if key == 27:  # ESC
                    break

        finally:
            self._cleanup()


if __name__ == "__main__":
    ifm = InsightFaceManager(0, use_cuda=True)
    print("init InsightFaceManager is completely done")
    ifm.run_in_thread = True
    ifm.start()

    try:
        while True:
            user_input = input("Enter command: ")
            if user_input.lower() == "quit":
                print("Exiting the loop.")
                break
            else:
                print(f"You entered: {user_input}")
    finally:
        ifm.stop()
