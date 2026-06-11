$(".nav button").on("click", function (){
  const page = $(this).data("page");

  $(".nav button").removeClass("active");
  $(this).addClass("active");

  $(".page").removeClass("active");
  $("#" + page).addClass("active");
});

// // Firebase 初期化
// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "YOUR_PROJECT.firebaseapp.com",
//   projectId: "YOUR_PROJECT_ID",
// };
// firebase.initializeApp(firebaseConfig);

// const db = firebase.firestore();

//googlelogin
$("#googleLogin").on("click", function () {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
});
//匿名ログイン
$("#guestLogin").on("click", function () {
  auth.signInAnonymously();
});
//ログイン状態の監視
auth.onAuthStateChanged(function (user) {
  const $userInfo = $("#userInfo");

  if (user) {
    const name = user.displayName || "ゲストユーザー";
    $userInfo.text("ログイン中：" + name);
  } else {
    $userInfo.text("ログインしていません");
  }
});
// //登校時にuidを保存
// $("#postForm").on("submit", async function (e) {
//   e.preventDefault();

//   const name = $("#name").val();
//   const text = $("#text").val();

//   await db.collection("posts").add({
//     name: name,
//     text: text,
//     uid: auth.currentUser ? auth.currentUser.uid : null,
//     createdAt: firebase.firestore.FieldValue.serverTimestamp(),
//   });

//   $("#text").val("");
// });





// // 投稿処理（jQuery版）
// $("#postForm").on("submit", async function (e) {
//   e.preventDefault();

//   const name = $("#name").val();
//   const text = $("#text").val();

//   await db.collection("posts").add({
//     name: name,
//     text: text,
//     createdAt: firebase.firestore.FieldValue.serverTimestamp(),
//   });

//   $("#text").val("");
// });


// // 投稿のリアルタイム表示（jQuery版）
// db.collection("posts")
//   .orderBy("createdAt", "desc")
//   .onSnapshot(function (snapshot) {
//     const $postsDiv = $("#posts");
//     $postsDiv.empty();

//     snapshot.forEach(function (doc) {
//       const data = doc.data();
//       const html = `
//         <div class="post">
//           <strong>${data.name}</strong><br>
//           ${data.text}<br>
//           <small>${data.createdAt ? data.createdAt.toDate() : ""}</small>
//           <hr>
//         </div>
//       `;
//       $postsDiv.append(html);
//     });
//   });
//削除ボタン
db.collection("posts")
  .orderBy("createdAt", "asc")
  .onSnapshot(function (snapshot) {
    const $postsDiv = $("#posts");
    $postsDiv.empty();

    snapshot.forEach(function (doc) {
      const data = doc.data();
      const postId = doc.id;

      // ログイン中のユーザー
      const currentUid = auth.currentUser ? auth.currentUser.uid : null;

      // 削除ボタン（本人だけ表示）
      const deleteButton =
        currentUid && currentUid === data.uid
          ? `<button class="deleteBtn" data-id="${postId}">削除</button>`
          : "";

      const html = `
        <div class="post">
          <strong>${data.name}</strong><br>
          ${data.text}<br>
          <small>${data.createdAt ? data.createdAt.toDate() : ""}</small>
          ${deleteButton}
          <hr>
        </div>
      `;
      $postsDiv.append(html);
    });
  });
// 削除ボタンのクリックイベント
$(document).on("click", ".deleteBtn", async function () {
  const postId = $(this).data("id");

  await db.collection("posts").doc(postId).delete();
});

$("#postForm").on("submit", async function (e) {
  e.preventDefault();

  const name = $("#name").val();
 const text = $("#text").val(); // ← まず値を取得
$("#text").val("");            // ← その後で空にする


  // 空投稿禁止
  if (!text.trim()) {
    alert("空の投稿はできません。");
    return;
  }

  // 文字数制限
  if (text.length > 300) {
    alert("投稿は300文字以内にしてください。");
    return;
  }

  // NGワードチェック
  const ngWords = ["死ね", "殺す", "バカ", "クソ"];
  if (ngWords.some(word => text.includes(word))) {
    alert("NGワードが含まれています。投稿できません。");
    return;
  }

  // 連投制限（10秒）
  const lastPostTime = localStorage.getItem("lastPostTime");
  const now = Date.now();
  if (lastPostTime && now - lastPostTime < 10000) {
    alert("連投は10秒間できません。");
    return;
  }
  localStorage.setItem("lastPostTime", now);

  // Firestore へ投稿
  await db.collection("posts").add({
    name,
    text,
    uid: auth.currentUser ? auth.currentUser.uid : null,
    createdAt: new Date(),
  });

  $("#text").val("");
});
//投票投稿
$("#postReaction").on("click", async function () {
  const name = $("#name").val();
  const text = $("#text").val();

  
  // 連投制限（10秒）
  const lastPostTime = localStorage.getItem("lastPostTime");
  const now = Date.now();

    // 空投稿禁止
  if (!text.trim()) {
    alert("空の投稿はできません。");
    return;
  } 
  //連投制限
  if (lastPostTime && now - lastPostTime < 10000) {
    alert("連投は10秒間できません。");
    return;
  }
  localStorage.setItem("lastPostTime", now);

  await db.collection("posts").add({
    type: "reaction",
    name,
    text,
    uid: auth.currentUser ? auth.currentUser.uid : null,
    likes: 0,
    dislikes: 0,
    createdAt: new Date()
  });

  $("#text").val("");
});


// 投稿データを取得
function loadPosts() {
  return JSON.parse(localStorage.getItem("posts") || "[]");
}

// // 投稿一覧を表示
// function renderPosts() {
//   const posts = loadPosts();
//   const keyword = $("#searchInput").val();
//   const $list = $("#postList");

//   $list.empty();

//   posts
//     .filter(p => p.text.includes(keyword) || p.tags.some(t => t.includes(keyword)))
//     .forEach(post => {
//       const $div = $(`
//         <div class="post-card">
//           <div class="text">${post.text}</div>
//           <div class="tags">
//             ${post.tags.map(t => `<span class="tag">#${t}</span>`).join("")}
//           </div>
//         </div>
//       `);

//       $list.append($div);
//     });
// }
db.collection("posts")
  .orderBy("createdAt", "asc")
  .onSnapshot(function (snapshot) {
    const $postsDiv = $("#posts");
    $postsDiv.empty();

    snapshot.forEach(function (doc) {
      const data = doc.data();
      const postId = doc.id;

      const currentUid = auth.currentUser ? auth.currentUser.uid : null;

      const deleteButton =
        currentUid && currentUid === data.uid
          ? `<button class="deleteBtn" data-id="${postId}">削除</button>`
          : "";

      // ▼ type によって表示を切り替える
      let reactionUI = "";
      if (data.type === "reaction") {
        reactionUI = `
          <div class="reactions">
            <button class="likeBtn" data-id="${postId}">👍 ${data.likes}</button>
            <button class="dislikeBtn" data-id="${postId}">👎 ${data.dislikes}</button>
          </div>
        `;
      }

      const html = `
        <div class="post">
          <strong>${data.name}</strong><br>
          ${data.text}<br>
          <small>${data.createdAt ? data.createdAt.toDate() : ""}</small>
          ${reactionUI}
          ${deleteButton}
          <hr>
        </div>
      `;
      $postsDiv.append(html);
    });

    scrollToBottom();
  });
// // 👍 like
// $(document).on("click", ".likeBtn", async function () {
//   const id = $(this).data("id");
//   const ref = db.collection("posts").doc(id);

//   await ref.update({
//     likes: firebase.firestore.FieldValue.increment(1)
//   });
// });

// // 👎 dislike
// $(document).on("click", ".dislikeBtn", async function () {
//   const id = $(this).data("id");
//   const ref = db.collection("posts").doc(id);

//   await ref.update({
//     dislikes: firebase.firestore.FieldValue.increment(1)
//   });
// });

// 一番下へスクロールする関数
function scrollToBottom() {
  $("html, body").animate(
    { scrollTop: $(document).height() },
    400
  );
}

// ボタンクリックで下へ移動
$("#scrollBottomBtn").on("click", function () {
  scrollToBottom();
});



// 初期表示
// ① まず関数を定義
function renderPosts() {
  const posts = loadPosts();
  const keyword = $("#searchInput").val();
  const $list = $("#postList");

  $list.empty();

  posts
    .filter(p => p.text.includes(keyword) || p.tags.some(t => t.includes(keyword)))
    .forEach(post => {
      const $div = $(`
        <div class="post-card">
          <div class="text">${post.text}</div>
          <div class="tags">
            ${post.tags.map(t => `<span class="tag">#${t}</span>`).join("")}
          </div>
        </div>
      `);

      $list.append($div);
    });
}
$(document).on("click", ".likeBtn", async function () {
  const postId = $(this).data("id");
  const uid = auth.currentUser?.uid;
  if (!uid) return alert("ログインしてください");

  const ref = db.collection("posts").doc(postId)
                .collection("reactions").doc(uid);

  const snap = await ref.get();

  // すでに評価済み
  if (snap.exists) {
    alert("この投稿はすでに評価済みです");
    return;
  }

  // 初めての評価 → 保存
  await ref.set({ type: "like" });

  // 投稿本体の like 数を +1
  await db.collection("posts").doc(postId).update({
    likes: firebase.firestore.FieldValue.increment(1)
  });
});
$(document).on("click", ".dislikeBtn", async function () {
  const postId = $(this).data("id");
  const uid = auth.currentUser?.uid;
  if (!uid) return alert("ログインしてください");

  const ref = db.collection("posts").doc(postId)
                .collection("reactions").doc(uid);

  const snap = await ref.get();

  if (snap.exists) {
    alert("この投稿はすでに評価済みです");
    return;
  }

  await ref.set({ type: "dislike" });

  await db.collection("posts").doc(postId).update({
    dislikes: firebase.firestore.FieldValue.increment(1)
  });
});


// ② その後で呼び出す
renderPosts();

