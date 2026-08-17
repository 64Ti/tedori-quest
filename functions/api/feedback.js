// functions/api/feedback.js — Cloudflare Pages Functions（Cloudflareのエッジで動作。手元にNode不要）。
// ★Web3Forms の access_key はここ（env.WEB3FORMS_KEY）にしか存在させない（CLAUDE.md 制約1）。
//   フロントは同一オリジンの /api/feedback のみを呼ぶ。

/**
 * POST /api/feedback を受け、access_key を付与して Web3Forms へ中継する。
 * @param {{request:Request, env:Record<string,string>}} ctx
 * @returns {Promise<Response>}
 */
export async function onRequestPost({ request, env }){
  let body;
  try{ body = await request.json(); }
  catch{ return json({ success:false, message:'invalid body' }, 400); }

  if (body.botcheck) return json({ success:true }, 200);       // Honeypot：静かに握り潰す

  // ★環境変数未設定時は診断しやすいよう明示的に500を返す（デプロイ後の設定漏れ検知用）。
  if (!env.WEB3FORMS_KEY){
    return json({ success:false, message:'Server configuration error: Missing API Key' }, 500);
  }

  try{
    const res = await fetch('https://api.web3forms.com/submit', {
      method:'POST',
      // ★Web3Forms公式のJSON送信例はAccept: application/jsonも合わせて送る
      //   （Content-Typeのみだとコンテントネゴシエーションで意図しない応答形式になりうる）。
      headers:{ 'Content-Type':'application/json', 'Accept':'application/json' },
      body: JSON.stringify({
        ...body,
        access_key: env.WEB3FORMS_KEY,                         // ★サーバ側環境変数のみに存在
        subject: '【てどりクエスト】β版フィードバック'
      })
    });
    return new Response(await res.text(), {
      status: res.status, headers:{ 'Content-Type':'application/json' }
    });
  }catch(error){
    return json({ success:false, message: error.message }, 500);
  }
}

/**
 * JSON レスポンスを組み立てる。
 * @param {object} obj
 * @param {number} status
 * @returns {Response}
 */
function json(obj, status){
  return new Response(JSON.stringify(obj), { status, headers:{ 'Content-Type':'application/json' } });
}
