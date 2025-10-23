// skyway.js (Room API / v4 版, 1ファイル完結)
// 依存: <script src="https://cdn.jsdelivr.net/npm/@skyway-sdk/room/dist/skyway_room-latest.js"></script>
// 必須DOM: #myuserid, #myroomid, #apiKey(=API Secret), #appId(=Application Id)
// 任意DOM: #local-videos, #button-area, #remote-media-area, #my-id, #mutecheckbox

/* =========================
 *  SDK import
 * ========================= */
const { nowInSec, SkyWayAuthToken, SkyWayContext, SkyWayRoom, SkyWayStreamFactory, uuidV4 } = skyway_room;

/* =========================
 *  グローバル状態
 * ========================= */
let gContext = null;
let gRoom = null;
let gMe = null;
let gMyName = null;

let gLocalMicPub = null; // Publication
let gLocalCamPubs = []; // Publication[]
let gLocalDataPub = null;

// 共有（画面）
let gShareVideoStream = null; // LocalVideoStream (display)
let gShareAudioStream = null; // LocalAudioStream|null
let gShareVideoPub = null; // Publication
let gShareAudioPub = null; // Publication|null
const gScreenEndHandlers = { video: null, audio: null };

let gMyDataStream = null; // Local DataStream

// 相互購読の一度きりトリガー判定
const mutualSubTriggered = new Set(); // memberId -> handled

const LOCAL_VIDEOS = () => document.getElementById("local-videos");
const REMOTE_AREA = () => document.getElementById("remote-media-area");
const BUTTON_AREA = () => document.getElementById("button-area");
const MY_ID_EL = () => document.getElementById("my-id");

//cache
const WEBRTC_TOPOLOGY = "webrtc_topology";
function onSiteLoadOnSkyway(){
	var webrtc_topology_selected = localStorage.getItem(WEBRTC_TOPOLOGY) || "p2p";
	if(webrtc_topology_selected == "p2p"){
		document.getElementById('webrtc_topology').options[0].selected = true;
	} else {
		document.getElementById('webrtc_topology').options[1].selected = true;
	}
}

const safeJSON = (s) => {
	try {
		return s ? JSON.parse(s) : null;
	} catch {
		return null;
	}
};
const displayNameOfMember = (m) => safeJSON(m.metadata)?.userName ?? m.name ?? m.id;

/* =========================
 *  自動再購読対象
 * ========================= */
const autoSubTargets = new Set(); // memberId の集合

/* =========================
 *  映像スロット（publisherごとにaudio共有）
 * ========================= */
const videoSlots = new Map(); // pubId -> { el, ms, videoTrack, audioTrack?, pubId, publisherId, userName, track }
window.__videoSlots = videoSlots;

// publisherId -> { pubId, track }
const audioByPublisher = new Map();
// publisherId -> Set(slot)
const pendingSlotsByPublisher = new Map();

function createVideoSlot(pub) {
	let userName = pub.id,
		track = 0;
	if (pub.publisher.metadata) {
		const md = safeJSON(pub.publisher.metadata);
		if (md?.userName) userName = md.userName;
		if (md?.track != null) track = md.track;
	}
	if (pub.metadata) {
		const md = safeJSON(pub.metadata);
		if (md?.track != null) track = md.track;
	}
	const el = addRemoteVideo(userName, track);
	const ms = new MediaStream();
	el.srcObject = ms;
	const slot = { el, ms, videoTrack: null, audioTrack: null, pubId: pub.id, publisherId: pub.publisher.id, userName, track };
	videoSlots.set(pub.id, slot);
	return slot;
}
function createAudio(pub) {
	let userName = pub.id,
		track = 0;
	if (pub.publisher.metadata) {
		const md = safeJSON(pub.publisher.metadata);
		if (md?.userName) userName = md.userName;
		if (md?.track != null) track = md.track;
	}
	if (pub.metadata) {
		const md = safeJSON(pub.metadata);
		if (md?.track != null) track = md.track;
	}
	return addRemoteSound(userName, track, "false");
}
function ensurePendingSet(publisherId) {
	let set = pendingSlotsByPublisher.get(publisherId);
	if (!set) {
		set = new Set();
		pendingSlotsByPublisher.set(publisherId, set);
	}
	return set;
}
function attachAudioToAllSlotsOfPublisher(publisherId, audioTrack) {
	const set = pendingSlotsByPublisher.get(publisherId);
	if (!set) return;
	for (const slot of set) {
		if (!slot.audioTrack) {
			const t = audioTrack.clone();
			for (const a of slot.ms.getAudioTracks()) slot.ms.removeTrack(a);
			slot.ms.addTrack(t);
			slot.audioTrack = t;
			t.addEventListener("ended", () => {
				try {
					slot.ms.removeTrack(t);
				} catch {}
				if (slot.audioTrack === t) slot.audioTrack = null;
			});
			slot.el.play().catch(async () => {
				slot.el.muted = true;
				try {
					await slot.el.play();
				} catch {}
			});
		}
	}
}
function detachSlotAndRemove(pubId) {
	const slot = videoSlots.get(pubId);
	if (!slot) return;
	try {
		for (const t of slot.ms.getTracks()) slot.ms.removeTrack(t);
	} catch {}
	try {
		slot.el.pause();
		slot.el.srcObject = null;
		slot.el.remove();
	} catch {}
	const set = pendingSlotsByPublisher.get(slot.publisherId);
	set?.delete(slot);
	videoSlots.delete(pubId);
}
function removeAudioFromAllSlotsOfPublisher(publisherId) {
	const set = pendingSlotsByPublisher.get(publisherId);
	if (!set) return;
	for (const slot of set) {
		if (slot.audioTrack) {
			try {
				slot.ms.removeTrack(slot.audioTrack);
			} catch {}
			slot.audioTrack = null;
		}
	}
}
function hasAnyVideoSlot(publisherId) {
	const set = pendingSlotsByPublisher.get(publisherId);
	if (set && set.size > 0) return true;
	for (const [, slot] of videoSlots) if (slot.publisherId === publisherId) return true;
	return false;
}

/* =========================
 *  購読レジストリと unsubscribe
 * ========================= */
// pubId -> { subscription, stream, kind: 'video'|'audio'|'data', slot?, onData?, audioEl? }
const subsByPubId = new Map();
function registerSub(pubId, rec) {
	subsByPubId.set(pubId, rec);
}
function getSub(pubId) {
	return subsByPubId.get(pubId) || null;
}
function eraseSub(pubId) {
	subsByPubId.delete(pubId);
}

async function unsubscribePubById(pubId) {
	const rec =
		getSub(pubId) ||
		(() => {
			console.warn("search subscription " + pubId);
			const s = gMe?.subscriptions?.find((x) => x.publication.id === pubId);
			return s ? { subscription: s, kind: s.contentType } : null;
		})();
	if (!rec) {
		console.warn("not found subscribing stream " + pubId);
		return false;
	}

	if (rec.kind === "data" && rec.onData && rec.stream?.onData?.remove) {
		try {
			rec.stream.onData.remove(rec.onData);
		} catch {
			console.warn("data unsubscriber");
		}
	}
	if (rec.kind === "video") {
		detachSlotAndRemove(pubId);
	}
	if (rec.kind === "audio") {
		const publisherId = rec.subscription.publication.publisher.id;
		removeAudioFromAllSlotsOfPublisher(publisherId);
		const entry = audioByPublisher.get(publisherId);
		if (entry?.pubId === pubId) audioByPublisher.delete(publisherId);
		if (rec.audioEl) {
			try {
				rec.audioEl.pause();
				rec.audioEl.srcObject = null;
				rec.audioEl.remove();
			} catch {
				console.warn("audio unsubscriber");
			}
		}
	}
	console.log("unsubscribe " + rec.subscription.id + " of " + displayNameOfMember(rec.subscription.publication.publisher));
	await gMe.unsubscribe(rec.subscription.id);
	
	eraseSub(pubId);
	return true;
}

async function ensureMutualSubscribe(remoteMemberOrId) {
	if (!gRoom || !gMe || !remoteMemberOrId) return;
	const id = typeof remoteMemberOrId === "string" ? remoteMemberOrId : remoteMemberOrId.id;
	if (!id || id === gMe.id) return;
	if (mutualSubTriggered.has(id)) return; // 2度目以降は無視
	mutualSubTriggered.add(id);

	// 以後の新規 publish も自動追従
	autoSubTargets.add(id);

	// 既存 pub を一括購読（あなたのロジックを再利用）
	try {
		//await callRemoteOne(id);
		console.log("callback to "+displayNameOfMember(remoteMemberOrId));
		connectClick(displayNameOfMember(remoteMemberOrId), "connect");
	} catch (e) {
		console.warn("ensureMutualSubscribe failed:", id, e);
	}
}

// 任意: Publication に相互購読トリガーを張るヘルパー
function wireMutualOnPub(pub) {
	try {
		console.log("I published " + pub.id +", type = "+pub.contentType+ " " + displayNameOfMember(pub.publisher));
		pub.onConnectionStateChanged.add(async ({ state, remoteMember }) => {
			if (!remoteMember) return;
			console.log(displayNameOfMember(remoteMember)+ " changes my publish ("+pub.id+", type="+pub.contentType+") to " + state);
			if (state === "connected") {
				// 相手がこの pub を subscribe してきた → 相互購読トリガー
				ensureMutualSubscribe(remoteMember);
			} else if (state === "disconnected") {
				// 相手がこの pub を unsubscribe した → こちらもその相手のpubを全部unsubscribe
				console.log(`[mirror] ${displayNameOfMember(remoteMember)} unsubscribed from my pub -> mirror unsubscribe`);
				// 全部data
				if(pub.contentType == "data" && mutualSubTriggered.has(remoteMember.id)){
					/*
					// 次回、相手が再度こちらをsubscribeしたときに mutual を再実行できるよう解除
					mutualSubTriggered.delete(remoteMember.id);
					// 対称性を保つため自動追従も一旦止める（方針に応じて外してOK）
					autoSubTargets.delete(remoteMember.id);
					//await unsubscribeAllFromMember(remoteMember, "peer-unsubscribed");
					closeRemote(displayNameOfMember(remoteMember));
					*/
				}
			}
		});
	} catch (e) {
		console.warn(e);
	}
}

async function unsubscribeAllFromMember(member, reason = "peer-unsubscribed") {
	const targets = [];
	for (const [pid, rec] of subsByPubId) {
		if (rec.subscription?.publication?.publisher?.id === member.id) {
			targets.push(pid);
		}
	}
	if (targets.length === 0) return;

	console.log(`[mirror] unsubscribe all from ${member.id} (${reason}) ->`, targets);
	connectClick(displayNameOfMember(member), "disconnect");
}

/* =========================
 *  Token生成
 * ========================= */
function createToken(appId, apiSecret) {
	const token = new SkyWayAuthToken({
		jti: uuidV4(),
		iat: nowInSec(),
		exp: nowInSec() + 60 * 60 * 24,
		version: 3,
		scope: {
			appId: appId,
			rooms: [{ name: "*", methods: ["create", "close", "updateMetadata"], member: { name: "*", methods: ["publish", "subscribe", "updateMetadata"] } }],
			turn: { enabled: true },
		},
	});
	return token.encode(apiSecret);
}

/* =========================
 *  公開関数
 * ========================= */

async function gotoStandby() {
	//WebRTCの形式と送信するVideoの個数の上限をチェック
	if(!checkValidCameraNumber()){
		alert("max number of camera is 3 for p2p mode");
		return;
	}

	const userId = document.getElementById("myuserid")?.value?.trim();
	gMyName = userId;
	const roomId = document.getElementById("myroomid")?.value?.trim();
	const apiSecret = document.getElementById("apiKey")?.value?.trim();
	const appId = document.getElementById("appId")?.value?.trim();

	if (!userId || !roomId || !apiSecret || !appId) {
		alert("input userId / roomId / appId / apiKey(API Secret)");
		return;
	}
	const btn = document.getElementById('step_button');
  const spinner = document.getElementById('step_button_spinner');
  const label = document.getElementById('step_button_label');
	spinner.style.display = 'inline-block';
	btn.disabled = true;
  label.textContent = 'Trying to log in...';

	const token = createToken(appId, apiSecret);
	const webrtc_topology = document.getElementById('webrtc_topology').value; 
  
	gContext = await SkyWayContext.Create(token);
	//https://skyway.ntt.com/ja/docs/user-guide/commons/default-room/
	//room作成時にtypeは指定せずにPublishするStreamごとに指定することで混在できる
	gContext.onFatalError.add(async () => {
		console.error(e);
		addInformation(e);
		gContext.dispose();
		gContext = await SkyWayContext.Create(token);
		gRoom = await SkyWayRoom.FindOrCreate(gContext, {name: roomId });
		gMe = await gRoom.join({ metadata: JSON.stringify({ userName: userId }) });	
		console.log("relogin : "+userId+"@"+roomId +", "+webrtc_topology+" -> "+gMe.id);	
	});
	gRoom = await SkyWayRoom.FindOrCreate(gContext, {name: roomId });
	gMe = await gRoom.join({ metadata: JSON.stringify({ userName: userId }) });
	console.log("login : "+userId+"@"+roomId +", "+webrtc_topology+" -> "+gMe.id);	
	localStorage.setItem(WEBRTC_TOPOLOGY, webrtc_topology);

	readyToChat();
	if (MY_ID_EL()) MY_ID_EL().textContent = gMe.id;

	// Mic
	if (window.localMicStreamSkyway == null) await getSelectedMicStream();
	if (window.localMicStreamSkyway) {
		gLocalMicPub = await gMe.publish(window.localMicStreamSkyway, {
			type: webrtc_topology,
			metadata: JSON.stringify({ label: "local_audio", track: 0, id: gMe.id, userName: gMyName }),
		});

		wireMutualOnPub(gLocalMicPub);
		/*
		gLocalMicPub.onConnectionStateChanged.add(({ state, remoteMember }) => {
			console.log("local mic stream state:", state, "->", displayNameOfMember(remoteMember));
		});
		*/
		const muteCb = document.getElementById("mutecheckbox");
		if (muteCb) {
			if (!muteCb.checked) gLocalMicPub.disable();
			muteCb.addEventListener("change", () => (muteCb.checked ? gLocalMicPub.enable() : gLocalMicPub.disable()));
		}
	} else {
		console.log("no mic");
	}

	// Local Cameras
	const elements = document.getElementsByName("local_camera_video");
	for (let i = 0; i < elements.length; i++) {
		const stream = window.localVideoStreamMap.get(elements[i]);
		if (!stream) continue;
		//https://skyway.ntt.com/ja/docs/cookbook/javascript-sdk/large-scale/
		const metadataStr = JSON.stringify({ label: "localVideo_" + i, track: i, id: gMe.id, userName: gMyName });
		/*
		const vPub = await gMe.publish(stream,
			{ metadata: metadataStr,
				encodings: [
					{ scaleResolutionDownBy: 4, id: "low", maxBitrate: 200_000 },
  			  { scaleResolutionDownBy: 1, id: "high", maxBitrate: 800_000 },
				]
			});
			*/
		const vPub = await gMe.publish(stream,
			{
				metadata: metadataStr,
				type: webrtc_topology,
			}
		);
		
		vPub.onConnectionStateChanged.add(({ state, remoteMember }) => {
			if(remoteMember){
				console.log("localVideo_",i," stream state:", state, "->", displayNameOfMember(remoteMember));
			} else {
				console.log("localVideo_",i," stream state:", state, " for sfu ?");
			}
		});
		gLocalCamPubs.push(vPub);
		wireMutualOnPub(vPub);
	}

	// DataStreamはP2Pにしか対応していないので明示的に
	gMyDataStream = await SkyWayStreamFactory.createDataStream();
	gLocalDataPub = await gMe.publish(gMyDataStream, {type: "p2p", metadata: JSON.stringify({ label: "data", id: gMe.id, userName: gMyName }) });
	/*
	gLocalDataPub.onConnectionStateChanged.add(({ state, remoteMember }) => {
		console.log("local data stream state:", state, "->", displayNameOfMember(remoteMember));
	});
	*/
	wireMutualOnPub(gLocalDataPub);

	// 既存メンバー
	loginUsers = [];
	gRoom.members.forEach((member) => {
		if (member.id === gMe.id){
		} else {
			const md = safeJSON(member.metadata);
			const name = md?.userName ?? member.name ?? member.id;
			console.log("current member:", member.id, `(${name})`);
			loginUsers.push(name);
		}
	});
	updateLoginInfo();

	// Member
	gRoom.onMemberJoined.add(({ member }) => {
		member.onMetadataUpdated.add(() => {
			/* 名前変化対応が必要ならここで */
		});
	});
	gRoom.onMemberLeft.add(({ member }) => {
		const md = safeJSON(member.metadata);
		const name = md?.userName ?? member.name ?? member.id;
		console.log("left member:", member.id, `(${name})`);
		connectClick(displayNameOfMember(member), "disconnect");
		//closeRemote(displayNameOfMember(member));
		// 自動購読対象から外す（安全）
		//autoSubTargets.delete(member.id);
	});
	gRoom.onMemberListChanged.add(() => {
		console.log("member list changed");
		loginUsers = gRoom.members.filter((m) => m.id != gMe.id).map((m) => safeJSON(m.metadata)?.userName ?? m.name ?? m.id);
		updateLoginInfo();
	});

	// 新規 publish / unpublish
	gRoom.onStreamPublished.add(({ publication }) => {
		if (publication.publisher.id === gMe.id) return;
		console.log("start pub : "+publication.id +" from "+displayNameOfMember(publication.publisher));
		handleNewPublication(publication).catch((e) => console.warn("auto-subscribe failed:", e));
	});
	gRoom.onStreamUnpublished.add(({ publication }) => {
		if (publication.publisher.id === gMe.id) return;
		// こちらが購読していれば掃除
		console.log("stop pub : "+publication.id +" from "+displayNameOfMember(publication.publisher));
		if (getSub(publication.id)) {
			unsubscribePubById(publication.id).catch((e) => console.warn("auto-unsub failed:", e));
		}
	});

	spinner.style.display = 'none';
	btn.disabled = false;
	label.textContent = 'Ready';
}

// 2) 切断・後片付け
async function logout() {
	try {
		// 全購読解除
		const pubIds = Array.from(subsByPubId.keys());
		for (const pid of pubIds) {
			try {
				await unsubscribePubById(pid);
			} catch (e) {
				console.warn("unsubscribe on logout failed:", pid, e);
			}
		}
		// 画面共有停止
		await stopScreenShare("logout").catch(() => {});
		// カメラ停止
		for (const pub of gLocalCamPubs) {
			try {
				await pub.stop?.();
			} catch {}
		}
		gLocalCamPubs = [];
		// マイク停止
		if (gLocalMicPub) {
			try {
				await gLocalMicPub.stop?.();
			} catch {}
			gLocalMicPub = null;
		}

		BUTTON_AREA()?.replaceChildren();
		if (gMe) {
			try {
				await gMe.leave();
			} catch {}
		}
		if (gRoom) {
			try {
				await gRoom.dispose();
			} catch {}
		}
		gContext = null;
		gRoom = null;
		gMe = null;
		if (MY_ID_EL()) MY_ID_EL().textContent = "";
	} catch (e) {
		console.error("logout failed", e);
	}
}


// =======================================================
// 1. 相手ごとに購読処理を直列化するためのキュー関数
// =======================================================
const subQueues = new Map(); // target.id ごとに処理を直列化

function enqueueSubscribe(targetId, task) {
  const prev = subQueues.get(targetId) ?? Promise.resolve();

  const next = prev
    .then(task)
    .catch((e) => {
      console.warn('[enqueueSubscribe] task error:', e);
    });

  subQueues.set(targetId, next);
  return next;
}

// =======================================================
// 3. 本体: callRemoteOne()
// =======================================================
async function callRemoteOne(remoteuserid) {
  if (!gRoom || !gMe) return false;

  const target = gRoom.members.find(
    (m) => m.id === remoteuserid || (m.metadata && safeJSON(m.metadata)?.userName === remoteuserid)
  );
  if (!target) {
    alert(`${remoteuserid} は入室していません`);
    return false;
  }

  // 相手メンバー単位で“ほんとの直列化”
  let result = false;
  await enqueueSubscribe(target.id, async () => {
    if (!mutualSubTriggered.has(target.id)) mutualSubTriggered.add(target.id);

    // publications は開始時点でスナップショット（途中で揺れないように）
    const pubs = gRoom.publications.filter((p) => p.publisher.id === target.id);

    const audioPubs = pubs.filter((p) => p.contentType === "audio");
    const videoPubs = pubs.filter((p) => p.contentType === "video");
    const dataPubs  = pubs.filter((p) => p.contentType === "data");
    const hasVideo  = videoPubs.length > 0;

		// ---- Data（複数あってもまずは1本だけ推奨）----
    let subscribedData = false;
    for (const pub of dataPubs) {
      if (subsByPubId.has(pub.id)) continue;
      try {
        await subscribeData(pub);
        subscribedData = true;
        await sleep(10);
        // 必要なら1本で break; にして多重 DataChannel を避ける
      } catch (e) {
        console.warn("data subscribe failed : "+ pub.id+" from "+displayNameOfMember(pub.publisher)+" : "+ e);
				addInformation("data subscribe failed : "+ pub.id+" from "+displayNameOfMember(pub.publisher)+" : "+ e);
      }
    }
		
    // ---- Audio（1本目だけ・未購読時のみ）----
    if (!audioByPublisher.has(target.id) && audioPubs.length > 0) {
      try {
        await subscribeAudio(audioPubs[0], hasVideo);
        await sleep(30);
      } catch (e) {
        console.warn("audio subscribe failed : "+ audioPubs[0].id+" from "+displayNameOfMember(audioPubs[0].publisher)+" : "+ e);
				addInformation("audio subscribe failed : "+ audioPubs[0].id+" from "+displayNameOfMember(audioPubs[0].publisher)+" : "+ e);
      }
    }

    // ---- Video（共有画面は最後に回す）----
    const normalVideos = [];
    const shareVideos  = [];
    for (const pub of videoPubs) {
      const label = (pub.metadata && safeJSON(pub.metadata)?.label) || "";
      (label.includes("share_display") ? shareVideos : normalVideos).push(pub);
    }
    for (const pub of [...normalVideos, ...shareVideos]) {
      // 既に購読済みならスキップ（subsByPubId を利用）
      if (subsByPubId.has(pub.id)) continue;
      try {
        await subscribeVideo(pub);
        await sleep(30);
      } catch (e) {
        console.warn("video subscribe failed : "+ pub.id+" from "+displayNameOfMember(pub.publisher)+" : "+ e);
				addInformation("video subscribe failed : "+ pub.id+" from "+displayNameOfMember(pub.publisher)+" : "+ e);
      }
    }

    autoSubTargets.add(target.id);

    for (const [pid, rec] of subsByPubId) {
      if (rec.subscription?.publication?.publisher?.id == target.id) {
        console.log("subscribing " + pid + " from " + rec.subscription?.publication?.publisher?.id + " " +displayNameOfMember(rec.subscription?.publication?.publisher));
      }
    }

    result = subscribedData || hasVideo || audioPubs.length > 0;
  });

  return result;
}


// 自動追従の実体
async function handleNewPublication(pub) {
	const publisherId = pub.publisher.id;
	if (!autoSubTargets.has(publisherId)) return; // 追従対象外なら無視
	if (getSub(pub.id)) return; // 既に購読済みなら無視

	if (pub.contentType === "audio") {
		if (!audioByPublisher.has(publisherId)) {
			await subscribeAudio(pub, hasAnyVideoSlot(publisherId));
		} // 既に audio があるなら追加しない（ポリシー次第）
	} else if (pub.contentType === "video") {
		const md = safeJSON(pub.metadata);
		const label = md?.label || "";
		if (label.includes("share_display")) {
			await subscribeShareDisplay(pub);
		} else {
			await subscribeVideo(pub);
		}
	} else if (pub.contentType === "data") {
		await subscribeData(pub);
	}
}

async function subscribeVideo(pub) {
  console.log("subscribe video " + pub.id + " " + displayNameOfMember(pub.publisher));

  const { stream, subscription } = await subscribeAndWaitObj(pub, { preferredEncodingId: 'high' });
  const track = stream.track;
  const slot = createVideoSlot(pub);

  for (const v of slot.ms.getVideoTracks()) slot.ms.removeTrack(v);
  if (track) slot.ms.addTrack(track);
  slot.videoTrack = track;

  registerSub(pub.id, { subscription, stream, kind: "video", slot });
  console.log(subscription);

  const audioEntry = audioByPublisher.get(pub.publisher.id);
  const pendingSet = ensurePendingSet(pub.publisher.id);
  pendingSet.add(slot);
  if (audioEntry?.track) attachAudioToAllSlotsOfPublisher(pub.publisher.id, audioEntry.track);

  track?.addEventListener("ended", () => {
    console.log("video end " + pub.id + " " + displayNameOfMember(pub.publisher));
    detachSlotAndRemove(pub.id);
  });

  try { await slot.el.play(); } catch {}
}
async function subscribeShareDisplay(pub) {
  const { stream, subscription } = await subscribeAndWaitObj(pub, { preferredEncodingId: 'high' });

  addSharedScreen(displayNameOfMember(pub.publisher), stream);
  registerSub(pub.id, { subscription, stream, kind: "video" });

  stream.track?.addEventListener("ended", () => {
    console.log("shared display closed from " + displayNameOfMember(pub.publisher));
    removeSharedScreen(displayNameOfMember(pub.publisher));
  });
}

async function subscribeAudio(pub, hasVideo) {
  if (audioByPublisher.has(pub.publisher.id)) return;

  console.log("subscribe audio " + pub.id + " " + displayNameOfMember(pub.publisher));

  // 音声は preferredEncoding 無しでOK
  const { stream, subscription } = await subscribeAndWaitObj(pub, { preferredEncoding: null });

  const track = stream.track;
  audioByPublisher.set(pub.publisher.id, { pubId: pub.id, track });
  registerSub(pub.id, { subscription, stream, kind: "audio" });

  if (hasVideo) {
    attachAudioToAllSlotsOfPublisher(pub.publisher.id, track);
  } else {
    const audioEl = createAudio(pub);
    if (typeof stream.attach === "function") stream.attach(audioEl);
    else audioEl.srcObject = stream.toMediaStream?.() ?? null;

    const rec = getSub(pub.id);
    if (rec) rec.audioEl = audioEl;
  }

  track?.addEventListener("ended", () => {
    const entry = audioByPublisher.get(pub.publisher.id);
    if (entry?.track === track) audioByPublisher.delete(pub.publisher.id);
    removeAudioFromAllSlotsOfPublisher(pub.publisher.id);
  });
}
async function subscribeData(pub) {
  console.log("subscribe data " + pub.id + " " + displayNameOfMember(pub.publisher));

  const { stream, subscription } = await subscribeAndWaitObj(pub, { preferredEncoding: null });

  const onData = async (data) => {
    try {
      let msg;
      if (typeof data === "string") msg = JSON.parse(data);
      else if (data && typeof data === "object" && !(data instanceof Uint8Array)) msg = data;
      else msg = JSON.parse(new TextDecoder().decode(data));
      if (shouldDeliverToMe(msg)) handleIncomingMessage(msg, pub.publisher);
    } catch (e) {
      console.warn("data parse error:", e);
    }
  };

  if (stream?.onData?.add) stream.onData.add(onData);
  else console.warn("Data stream does not support onData.add");

  registerSub(pub.id, { subscription, stream, kind: "data", onData });
}
// ---- subscribe 完了（stream が生える）まで待つ共通ヘルパ ----
async function subscribeAndWaitObj(pub, { preferredEncoding = 'r0', timeoutMs = 12000 } = {}) {
  const sub = await gMe.subscribe(pub.id);

  // Simulcast時は低レイヤから開始（任意）
  if (preferredEncoding && 'preferredEncoding' in sub) {
    try { sub.preferredEncoding = preferredEncoding; } catch {}
  }

  if (sub.stream) return { stream: sub.stream, subscription: sub };

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('wait stream timeout')), timeoutMs);

    const off = sub.onConnectionStateChanged.add(({ state }) => {
      if ((state === 'completed' || state === 'connected') && sub.stream) {
        clearTimeout(timer); off(); resolve();
      } else if (state === 'failed' || state === 'canceled') {
        clearTimeout(timer); off(); reject(new Error('subscribe failed: ' + state));
      }
    });

    const iv = setInterval(() => {
      if (sub.stream) {
        clearTimeout(timer); clearInterval(iv); off?.(); resolve();
      }
    }, 100);
  });

  return { stream: sub.stream, subscription: sub };
}


function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}


async function closeRemote(remoteUserName) {
	const member = gRoom?.members.find((m) => m.id === remoteUserName || (m.metadata && safeJSON(m.metadata)?.userName === remoteUserName));
	if (!member) {
		//console.log("not found:", remoteUserName);
		removeRemoteVideo(remoteUserName);
		return;
	}

	console.log("close " + remoteUserName + " " + member.id);
	sendData(remoteUserName, "communication=close");

	mutualSubTriggered.delete(member.id);
	autoSubTargets.delete(member.id);

	// この相手の購読中 pub を subs レジストリから抽出して全部解除
	const targets = [];
	for (const [pid, rec] of subsByPubId) {
		if (rec.subscription?.publication?.publisher?.id === member.id) {
			targets.push(pid);
			console.log("try to unsubscribe " + pid + " from " + rec.subscription?.publication?.publisher?.id + " " + displayNameOfMember(rec.subscription?.publication?.publisher));
		}
	}
	try {			
		for (const pid of targets) {
			await unsubscribePubById(pid);
		}
	} catch (e) {
		console.warn("unsubscribe failed:", pid, e);
	} finally {
		// 画面上の残骸（フォールバック関数で掃除）
		removeRemoteVideo(remoteUserName);
  }
}

/* =========================
 *  画面共有（開始/差し替え/停止）
 * ========================= */
async function getShareDisplay() {
	if (!gRoom || !gMe) return false;
	try {
		if (gShareVideoStream) {
			try {
				await gShareVideoStream.stop();
			} catch {}
			gShareVideoStream = null;
		}
		if (gShareAudioStream) {
			try {
				await gShareAudioStream.stop();
			} catch {}
			gShareAudioStream = null;
		}

		const { video, audio } = await SkyWayStreamFactory.createDisplayStreams({ audio: true, video: { displaySurface: "monitor" } });
		gShareVideoStream = video;
		gShareAudioStream = audio || null;

		if (gShareVideoPub) {
			gShareVideoPub.replaceStream(video);
		} else {
			gShareVideoPub = await gMe.publish(video, { metadata: JSON.stringify({ label: "share_display", userId: gMe.id, userName: gMyName }) });
			wireMutualOnPub(gShareVideoPub);
		}

		if (audio) {
			if (gShareAudioPub) {
				gShareAudioPub.replaceStream(audio);
			} else {
				gShareAudioPub = await gMe.publish(audio, { metadata: JSON.stringify({ label: "share_audio", userId: gMe.id, userName: gMyName }) });
				wireMutualOnPub(gShareAudioPub);
			}
		}

		gScreenEndHandlers.video = () => {
			console.log("[screen-share] video track ended");
			stopScreenShare("track-ended");
		};
		video.track.addEventListener("ended", gScreenEndHandlers.video);

		if (audio) {
			gScreenEndHandlers.audio = () => {
				console.log("[screen-share] audio track ended");
				stopScreenShare("track-ended");
			};
			audio.track.addEventListener("ended", gScreenEndHandlers.audio);
		}
		return true;
	} catch (e) {
		console.error("share screen failed", e);
		return false;
	}
}

async function stopScreenShare(reason = "manual") {
	console.log("[screen-share] stopScreenShare:", reason);
	try {
		if (gShareVideoStream?.track && gScreenEndHandlers.video) gShareVideoStream.track.removeEventListener("ended", gScreenEndHandlers.video);
	} catch {}
	try {
		if (gShareAudioStream?.track && gScreenEndHandlers.audio) gShareAudioStream.track.removeEventListener("ended", gScreenEndHandlers.audio);
	} catch {}
	gScreenEndHandlers.video = null;
	gScreenEndHandlers.audio = null;

	try {
		await gShareVideoPub?.stop?.();
	} catch (e) {
		console.warn("stop video pub failed:", e);
	}
	try {
		await gShareAudioPub?.stop?.();
	} catch {}

	try {
		await gShareVideoStream?.stop?.();
	} catch {}
	try {
		await gShareAudioStream?.stop?.();
	} catch {}

	if (gShareVideoPub) await gMe.unpublish(gShareVideoPub.id);

	if (gShareAudioPub) await gMe.unpublish(gShareAudioPub.id);

	gShareVideoPub = gShareAudioPub = null;
	gShareVideoStream = gShareAudioStream = null;
}

/* =========================
 *  Data メッセージ
 * ========================= */
const MSG_VERSION = 1;
const BROADCAST_TO = "*";
const genMsgId = () => crypto?.randomUUID?.() ?? "msg_" + Math.random().toString(36).slice(2);

function buildPayload({ type, to, body }) {
	return { v: MSG_VERSION, id: genMsgId(), type, to: to ?? BROADCAST_TO, from: gMyName ?? "", room: gRoom?.name ?? "", ts: Date.now(), body };
}
function safeStringify(x) {
	try {
		return typeof x === "string" ? x : JSON.stringify(x);
	} catch {
		return String(x);
	}
}

// 全員宛
function publishData(sendText) {
	if (!gMyDataStream) {
		console.error("DataStream not ready");
		return;
	}
	const payload = buildPayload({ type: "broadcast", to: BROADCAST_TO, body: sendText });
	gMyDataStream.write(safeStringify(payload));
}
// 宛先（userName）指定
function sendData(toUserName, sendText) {
	if (!gMyDataStream) {
		console.error("DataStream not ready");
		return;
	}
	const payload = buildPayload({ type: "direct", to: toUserName, body: sendText });
	gMyDataStream.write(JSON.stringify(payload));
}
function shouldDeliverToMe(msg) {
	if (msg?.to === BROADCAST_TO) return true;
	if (msg?.to === gMyName) return true;
	return false;
}
function handleIncomingMessage(msg, publisher) {
	if (typeof window.getData === "function") {
		try {
			if(msg.body == "communication=close"){
				//closeRemote(msg.from);				
				connectClick(msg.from, "disconnect");
			} else {
				window.getData(msg.from, msg.body);
			}
		} catch (e) {
			console.warn("getData handler error:", e);
		}
	} else {
		console.log("DATA recv:", msg);
	}
}

/* =========================
 *  export
 * ========================= */
window.gotoStandby = gotoStandby;
window.logout = logout;
window.callRemoteOne = callRemoteOne;
window.getShareDisplay = getShareDisplay;
window.closeRemote = closeRemote;
window.publishData = publishData;
window.sendData = sendData;
window.unsubscribePubById = unsubscribePubById;
