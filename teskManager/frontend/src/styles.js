export const css = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg0:#090c14;--bg1:#0f1524;--bg2:#141929;--bg3:#1c2236;--bg4:#242b42;
  --border:rgba(99,120,180,0.15);--border2:rgba(99,120,180,0.28);
  --text0:#f0f4ff;--text1:#c4cde8;--text2:#8892b0;--text3:#4a5580;
  --accent:#6c8ef5;--accent2:#4f6fe8;--purple:#a78bfa;
  --font:'Space Grotesk',sans-serif;--mono:'JetBrains Mono',monospace;
  --sw:240px;
}
body{background:var(--bg0);color:var(--text0);font-family:var(--font);overflow-x:hidden}
button,input,select,textarea{font-family:var(--font)}

/* LOGIN */
.lw{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;
  background:radial-gradient(ellipse at 20% 50%,rgba(108,142,245,.09) 0%,transparent 60%),
             radial-gradient(ellipse at 80% 20%,rgba(167,139,250,.07) 0%,transparent 50%),var(--bg0)}
.lc{width:100%;max-width:420px;background:var(--bg1);border:1px solid var(--border2);
  border-radius:20px;padding:44px 36px;box-shadow:0 32px 80px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.05)}
.ll{font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--accent);font-family:var(--mono);margin-bottom:6px}
.lt{font-size:26px;font-weight:700;color:var(--text0);margin-bottom:4px}
.ls{font-size:14px;color:var(--text2);margin-bottom:30px}
.tabs{display:flex;gap:4px;background:var(--bg2);border-radius:10px;padding:4px;margin-bottom:24px}
.tbb{flex:1;padding:8px;border:none;border-radius:7px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;color:var(--text2);background:transparent}
.tbb.a{background:var(--bg4);color:var(--text0);box-shadow:0 2px 8px rgba(0,0,0,.3)}
.fd{margin-bottom:15px}
.fd label{display:block;font-size:11px;font-weight:700;color:var(--text2);letter-spacing:.5px;margin-bottom:6px;text-transform:uppercase}
.fd input{width:100%;padding:11px 14px;background:var(--bg2);border:1px solid var(--border2);border-radius:9px;color:var(--text0);font-size:14px;outline:none;transition:border-color .2s}
.fd input:focus{border-color:var(--accent)}
.fd input::placeholder{color:var(--text3)}
.bp{width:100%;padding:13px;background:linear-gradient(135deg,var(--accent2),var(--purple));border:none;border-radius:10px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 4px 20px rgba(108,142,245,.3)}
.bp:hover{transform:translateY(-1px)}
.bp:disabled{opacity:.6;cursor:not-allowed;transform:none}
.er{color:#ef4444;font-size:13px;margin-top:10px;text-align:center}
.hn{font-size:11px;color:var(--text3);margin-top:14px;text-align:center;font-family:var(--mono);line-height:1.7}

/* SHELL */
.shell{display:flex;min-height:100vh}

/* TOPBAR */
.topbar{display:none;align-items:center;justify-content:space-between;padding:12px 16px;
  background:var(--bg1);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:30}
.topbar-logo{font-size:13px;font-weight:700;color:var(--accent);font-family:var(--mono);letter-spacing:2px}
.hbg{width:36px;height:36px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;
  display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;cursor:pointer;border:none}
.hbg span{width:18px;height:2px;background:var(--text1);border-radius:2px}

/* SIDEBAR */
.sb{width:var(--sw);background:var(--bg1);border-right:1px solid var(--border);
  display:flex;flex-direction:column;padding:22px 13px;position:fixed;top:0;left:0;bottom:0;z-index:20;
  transition:transform .28s cubic-bezier(.4,0,.2,1);overflow-y:auto}
.sb-logo{font-size:10px;font-weight:700;letter-spacing:3px;color:var(--accent);font-family:var(--mono);margin-bottom:2px}
.sb-app{font-size:17px;font-weight:700;color:var(--text0);margin-bottom:22px}
.sb-x{display:none;position:absolute;top:14px;right:12px;background:var(--bg3);border:1px solid var(--border);
  border-radius:7px;color:var(--text1);cursor:pointer;width:28px;height:28px;align-items:center;justify-content:center;font-size:14px;border:none}
.ns{font-size:9px;font-weight:700;letter-spacing:2px;color:var(--text3);text-transform:uppercase;margin:10px 0 5px;padding-left:7px}
.ni{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:8px;font-size:13px;font-weight:500;
  color:var(--text2);cursor:pointer;transition:all .15s;margin-bottom:2px;border:none;background:none;width:100%;text-align:left}
.ni:hover{background:var(--bg3);color:var(--text0)}
.ni.ac{background:rgba(108,142,245,.12);color:var(--accent)}
.ni-ic{font-size:14px;width:18px;text-align:center}
.sb-bot{margin-top:auto}
.up{display:flex;align-items:center;gap:9px;padding:10px;background:var(--bg2);border-radius:10px;border:1px solid var(--border)}
.av{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;color:#fff}
.ui{flex:1;min-width:0}
.un{font-size:13px;font-weight:600;color:var(--text0);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ur{font-size:11px;color:var(--text3);text-transform:capitalize}
.lob{background:none;border:none;cursor:pointer;color:var(--text3);font-size:17px;padding:4px;border-radius:5px;transition:color .15s;display:flex;align-items:center;justify-content:center}
.lob:hover{color:#ef4444}
.sb-ov{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:15;backdrop-filter:blur(2px)}

/* MAIN */
.main{margin-left:var(--sw);flex:1;padding:28px 28px 60px;min-height:100vh}
.ph{margin-bottom:22px}
.pt{font-size:24px;font-weight:700;color:var(--text0)}
.ps{font-size:13px;color:var(--text2);margin-top:3px}

/* STATS */
.sg{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin-bottom:20px}
.sc{background:var(--bg1);border:1px solid var(--border);border-radius:12px;padding:17px 18px;position:relative;overflow:hidden}
.sc::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--ac,var(--accent))}
.sl{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:5px}
.sv{font-size:28px;font-weight:700;font-family:var(--mono);color:var(--ac,var(--accent))}
.ss{font-size:11px;color:var(--text2);margin-top:2px}

/* CARD */
.card{background:var(--bg1);border:1px solid var(--border);border-radius:14px;padding:20px;box-shadow:0 4px 24px rgba(0,0,0,.2)}
.ct{font-size:15px;font-weight:700;color:var(--text0);margin-bottom:15px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}

/* TOOLBAR */
.tb{display:flex;align-items:center;gap:9px;margin-bottom:16px;flex-wrap:wrap}
.tbl{display:flex;align-items:center;gap:7px;flex:1;min-width:0;flex-wrap:wrap}
.sx{display:flex;align-items:center;gap:6px;background:var(--bg2);border:1px solid var(--border);
  border-radius:8px;padding:7px 12px;flex:1;min-width:150px;max-width:280px}
.sx input{background:none;border:none;outline:none;color:var(--text0);font-size:13px;flex:1;min-width:0}
.sx input::placeholder{color:var(--text3)}
.vt{display:flex;gap:2px;background:var(--bg2);border-radius:8px;padding:3px;border:1px solid var(--border)}
.vb{padding:5px 12px;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;color:var(--text2);background:transparent}
.vb.a{background:var(--bg4);color:var(--text0)}
.bn{display:flex;align-items:center;gap:5px;padding:8px 15px;background:linear-gradient(135deg,var(--accent2),var(--purple));
  border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;
  box-shadow:0 4px 14px rgba(108,142,245,.3);white-space:nowrap;flex-shrink:0}
.bn:hover{transform:translateY(-1px)}
.bn:disabled{opacity:.6;cursor:not-allowed;transform:none}

/* WEEK */
.wn{display:flex;align-items:center;gap:9px;margin-bottom:13px;flex-wrap:wrap}
.wn button{background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text0);padding:5px 11px;cursor:pointer;font-size:13px;transition:background .15s}
.wn button:hover{background:var(--bg3)}
.wl{font-size:13px;font-weight:600;color:var(--text1)}
.wg{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}
.dc{background:var(--bg1);border:1px solid var(--border);border-radius:10px;overflow:hidden;min-height:140px}
.dc.tod .dh{background:rgba(108,142,245,.1)}
.dc.tod .dn{color:var(--accent)}
.dh{padding:7px;border-bottom:1px solid var(--border);text-align:center;background:var(--bg2)}
.dname{font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3)}
.dn{font-size:15px;font-weight:700;color:var(--text1);font-family:var(--mono);margin-top:1px}
.dts{padding:5px;display:flex;flex-direction:column;gap:3px}
.mt{padding:4px 6px;border-radius:5px;border-left:2.5px solid;font-size:10px;cursor:pointer;transition:opacity .15s;background:var(--bg2);font-weight:500;line-height:1.3}
.mt:hover{opacity:.75}
.ma{font-size:9px;color:var(--text2);margin-top:1px}

/* DAY NAV */
.dn2{display:flex;align-items:center;gap:9px;margin-bottom:16px;flex-wrap:wrap}
.dnb{background:var(--bg2);border:1px solid var(--border);border-radius:6px;color:var(--text1);padding:5px 11px;cursor:pointer;font-size:14px;transition:background .15s}
.dnb:hover{background:var(--bg3)}
.dtit{font-size:15px;font-weight:700;color:var(--text0)}
.tb2{margin-left:8px;color:var(--accent);font-size:11px;font-weight:700}

/* TASK ROWS */
.tl{display:flex;flex-direction:column;gap:9px}
.tr{background:var(--bg1);border:1px solid var(--border);border-radius:12px;padding:15px 17px;
  display:flex;align-items:flex-start;gap:13px;transition:all .15s;border-left:4px solid}
.tr:hover{background:var(--bg2);transform:translateX(2px)}
.tm{flex:1;min-width:0}
.ttr{display:flex;align-items:center;gap:6px;margin-bottom:4px;flex-wrap:wrap}
.tn{font-size:14px;font-weight:600;color:var(--text0)}
.bg{padding:2px 7px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;white-space:nowrap}
.tme{font-size:11px;color:var(--text2);display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.ta{display:flex;gap:4px;flex-shrink:0}
.ib{width:29px;height:29px;border-radius:6px;border:1px solid var(--border);background:var(--bg2);
  color:var(--text2);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;transition:all .15s}
.ib:hover{border-color:var(--border2);color:var(--text0);background:var(--bg3)}
.ib.d:hover{border-color:rgba(239,68,68,.4);color:#ef4444;background:rgba(239,68,68,.08)}
.ib.act{border-color:rgba(108,142,245,.4);color:var(--accent)}

/* TASK GROUP & NESTED SUBTASKS */
.tg{display:flex;flex-direction:column;gap:0}
.subs{display:flex;flex-direction:column;gap:4px;margin:6px 0 0 26px;padding-left:14px;
  border-left:1px dashed var(--border2)}
.subrow{display:flex;align-items:center;gap:8px;padding:6px 10px;background:var(--bg2);
  border:1px solid var(--border);border-left:3px solid;border-radius:6px;font-size:12px;transition:background .15s}
.subrow:hover{background:var(--bg3)}
.suri{font-size:13px;flex-shrink:0;line-height:1}
.surk{font-family:var(--mono);font-size:10px;color:var(--text3);flex-shrink:0;letter-spacing:.3px}
.surt{flex:1;color:var(--text1);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.surt:hover{color:var(--text0)}
.surb{padding:1px 6px;font-size:9px;flex-shrink:0}
.suav{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:10px;font-weight:700;color:#fff;flex-shrink:0}
.sib{width:22px;height:22px;font-size:11px}

/* AGILE BOARD */
.brd{display:flex;flex-direction:column;gap:14px}
.brdf{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.brdc{display:grid;grid-template-columns:repeat(3,minmax(260px,1fr));gap:14px;align-items:start}
@media (max-width:900px){.brdc{grid-template-columns:1fr}}
.brdcol{background:var(--bg1);border:1px solid var(--border);border-radius:12px;padding:0;
  display:flex;flex-direction:column;min-height:300px;transition:background .15s,border-color .15s}
.brdcol.dragover{background:var(--bg2);border-color:var(--accent)}
.brdh{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid var(--border);
  border-top:3px solid;border-radius:12px 12px 0 0;background:var(--bg2)}
.brdhi{font-size:15px}
.brdhl{flex:1;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text1)}
.brdhn{background:var(--bg3);color:var(--text2);font-family:var(--mono);font-size:11px;font-weight:700;
  padding:2px 7px;border-radius:10px;min-width:24px;text-align:center}
.brdcards{display:flex;flex-direction:column;gap:8px;padding:10px;flex:1;min-height:60px}
.brdempty{text-align:center;color:var(--text3);font-size:12px;padding:24px 8px;border:1px dashed var(--border);
  border-radius:8px;background:transparent}
.brdcard{background:var(--bg2);border:1px solid var(--border);border-left:3px solid;border-radius:8px;
  padding:9px 11px;cursor:grab;transition:transform .12s,box-shadow .12s,background .15s}
.brdcard:hover{background:var(--bg3);transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,0,0,.25)}
.brdcard:active{cursor:grabbing}
.brdcardh{display:flex;align-items:center;gap:6px;margin-bottom:5px}
.brdtype{font-size:14px;line-height:1}
.brdkey{font-family:var(--mono);font-size:10px;color:var(--text2);letter-spacing:.4px;flex:1}
.brdpd{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.brdcardt{font-size:13px;font-weight:600;color:var(--text0);margin-bottom:7px;line-height:1.35}
.brdcardf{display:flex;align-items:center;gap:8px;justify-content:space-between}
.brdcardd{font-size:10px;color:var(--text3);font-family:var(--mono)}

/* SPRINTS */
.spl{display:flex;flex-direction:column;gap:12px}
.spc{background:var(--bg1);border:1px solid var(--border);border-radius:12px;padding:16px 18px;
  display:flex;flex-direction:column;gap:8px;transition:background .15s,border-color .15s}
.spc:hover{background:var(--bg2);border-color:var(--border2)}
.spch{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.spn{font-size:15px;font-weight:700;color:var(--text0)}
.spa{display:flex;gap:6px;align-items:center}
.spg{font-size:12px;color:var(--text2);line-height:1.5}
.spm{display:flex;gap:10px;font-size:11px;color:var(--text2);align-items:center;font-family:var(--mono)}
.spbar{height:6px;background:var(--bg3);border-radius:3px;overflow:hidden;margin-top:4px}
.spbarf{height:100%;border-radius:3px;transition:width .25s}
.spform{background:var(--bg1);border:1px solid var(--border2);border-radius:12px;padding:18px;margin-bottom:14px}

/* BACKLOG */
.bkc{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;align-items:start}
.bkcol{background:var(--bg1);border:1px solid var(--border);border-radius:12px;display:flex;
  flex-direction:column;min-height:300px;transition:background .15s,border-color .15s}
.bkcol.dragover{background:var(--bg2);border-color:var(--accent)}
.bkh{display:flex;flex-direction:column;gap:3px;padding:12px 14px;border-bottom:1px solid var(--border);
  border-top:3px solid;border-radius:12px 12px 0 0;background:var(--bg2)}
.bkhl{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text1)}
.bkhs{font-size:10px;color:var(--text3);font-family:var(--mono)}
.bkcards{display:flex;flex-direction:column;gap:6px;padding:10px;flex:1;min-height:60px}
.bkhint{height:3px;background:var(--accent);border-radius:2px;margin:1px 0;box-shadow:0 0 8px rgba(108,142,245,.5)}
.bkhint-msg{font-size:12px;color:var(--text3);text-align:center;padding:8px;background:var(--bg2);border-radius:8px;margin-bottom:12px}
.bkcard{background:var(--bg2);border:1px solid var(--border);border-left:3px solid;border-radius:7px;
  padding:8px 10px;cursor:grab;transition:transform .12s,box-shadow .12s,background .15s}
.bkcard:hover{background:var(--bg3);transform:translateY(-1px)}
.bkcard:active{cursor:grabbing}
.bkcardh{display:flex;align-items:center;gap:6px;margin-bottom:4px}
.bkcardt{font-size:12px;font-weight:600;color:var(--text0);margin-bottom:5px;line-height:1.35}
.bkcardf{display:flex;align-items:center;gap:8px;justify-content:space-between}

/* ROADMAP */
.rmw{background:var(--bg1);border:1px solid var(--border);border-radius:12px;overflow:hidden}
.rmaxis{display:flex;border-bottom:1px solid var(--border);background:var(--bg2)}
.rmaxlabel{width:240px;flex-shrink:0;border-right:1px solid var(--border)}
.rmaxbar{flex:1;position:relative;height:40px}
.rmtick{position:absolute;top:0;height:100%;border-left:1px dashed var(--border)}
.rmtickline{height:8px;border-left:1px solid var(--border)}
.rmticklabel{position:absolute;top:14px;left:5px;font-size:10px;font-family:var(--mono);color:var(--text3);white-space:nowrap}
.rmtoday{position:absolute;top:0;height:100%;width:2px;background:var(--accent);box-shadow:0 0 6px rgba(108,142,245,.6);z-index:5}
.rmrows{display:flex;flex-direction:column}
.rmrow{display:flex;border-bottom:1px solid var(--border);min-height:42px;align-items:center}
.rmrow.rmrowsub{min-height:30px;background:rgba(255,255,255,.01)}
.rmlabel{width:240px;flex-shrink:0;display:flex;align-items:center;gap:7px;padding:6px 12px;border-right:1px solid var(--border);overflow:hidden}
.rmlbranch{color:var(--text3);font-family:var(--mono);font-size:12px;margin-left:6px}
.rmlt{font-size:13px;font-weight:600;color:var(--text0);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rmtrack{flex:1;position:relative;height:100%;min-height:38px}
.rmrowsub .rmtrack{min-height:28px}
.rmbar{position:absolute;top:50%;transform:translateY(-50%);height:24px;border-radius:6px;
  display:flex;align-items:center;gap:6px;padding:0 8px;cursor:pointer;
  transition:transform .12s,box-shadow .12s;color:#fff;font-size:11px;font-weight:600;overflow:hidden}
.rmrowsub .rmbar{height:16px;font-size:10px;padding:0 6px}
.rmbar:hover{transform:translateY(-50%) scale(1.02);box-shadow:0 4px 14px rgba(0,0,0,.35)}
.rmbartxt{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.rmbarav{width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0}
.rmbarstatus{font-size:11px;flex-shrink:0}

/* STATUS SELECTOR */
.ss2{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}
.so{padding:5px 11px;border-radius:6px;border:1.5px solid;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;background:transparent;white-space:nowrap}

/* MODAL */
.mo{position:fixed;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(4px);z-index:100;
  display:flex;align-items:center;justify-content:center;padding:16px;animation:fi .2s}
@keyframes fi{from{opacity:0}to{opacity:1}}
@keyframes su{from{transform:translateY(18px);opacity:0}to{transform:translateY(0);opacity:1}}
.md{background:var(--bg1);border:1px solid var(--border2);border-radius:18px;width:100%;
  max-width:540px;max-height:90vh;overflow-y:auto;box-shadow:0 40px 100px rgba(0,0,0,.7);animation:su .25s}
.md.wide{max-width:680px}
.mh{padding:22px 24px 0;display:flex;align-items:center;justify-content:space-between}
.mti{font-size:19px;font-weight:700;color:var(--text0)}
.mc{background:none;border:none;color:var(--text2);cursor:pointer;font-size:22px;padding:4px 8px;border-radius:6px;transition:color .15s;line-height:1}
.mc:hover{color:var(--text0)}
.mb{padding:20px 24px 24px;display:flex;flex-direction:column;gap:15px}
.fr{display:grid;grid-template-columns:1fr 1fr;gap:11px}
.ff{display:flex;flex-direction:column;gap:5px}
.ff label{font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--text2)}
.fi2,.fse,.fta{padding:9px 12px;background:var(--bg2);border:1px solid var(--border2);border-radius:8px;
  color:var(--text0);font-size:13px;outline:none;transition:border-color .2s;width:100%;font-family:var(--font)}
.fi2:focus,.fse:focus,.fta:focus{border-color:var(--accent)}
.fse{cursor:pointer}.fse option{background:var(--bg2)}
.fta{min-height:72px;resize:vertical}
.mf{display:flex;gap:8px;justify-content:flex-end;padding-top:6px;border-top:1px solid var(--border)}
.bg2{padding:9px 17px;background:var(--bg2);border:1px solid var(--border2);border-radius:8px;color:var(--text1);font-size:13px;font-weight:600;cursor:pointer;transition:all .15s}
.bg2:hover{background:var(--bg3)}
.bs{padding:9px 20px;background:linear-gradient(135deg,var(--accent2),var(--purple));border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;box-shadow:0 4px 14px rgba(108,142,245,.3)}
.bs:hover{transform:translateY(-1px)}
.bs:disabled,.bg2:disabled{opacity:.6;cursor:not-allowed;transform:none}
.bd{padding:9px 20px;background:linear-gradient(135deg,#dc2626,#b91c1c);border:none;border-radius:8px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s}
.bd:hover{transform:translateY(-1px)}

/* NOTIFICATION */
.no{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);z-index:200;display:flex;align-items:center;justify-content:center;animation:fi .3s}
.nc{background:var(--bg1);border:1px solid rgba(108,142,245,.45);border-radius:20px;padding:34px 38px;text-align:center;max-width:370px;width:90%;
  box-shadow:0 0 60px rgba(108,142,245,.22),0 40px 80px rgba(0,0,0,.6);animation:np .4s cubic-bezier(.34,1.56,.64,1)}
@keyframes np{from{transform:scale(.7) translateY(20px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
.ni2{font-size:44px;margin-bottom:13px;animation:pu 1s infinite}
@keyframes pu{0%,100%{transform:scale(1)}50%{transform:scale(1.13)}}
.nh{font-size:19px;font-weight:700;color:var(--text0);margin-bottom:6px}
.nta{font-size:14px;font-weight:600;color:var(--accent);margin-bottom:4px}
.nsu{font-size:12px;color:var(--text2);margin-bottom:20px}
.nb{padding:10px 28px;background:linear-gradient(135deg,var(--accent2),var(--purple));border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:700;cursor:pointer}

/* TOAST */
.toast{position:fixed;bottom:20px;right:20px;background:var(--bg1);border:1px solid var(--border2);
  border-left:4px solid var(--accent);padding:12px 16px;border-radius:10px;color:var(--text0);
  font-size:13px;box-shadow:0 8px 30px rgba(0,0,0,.5);z-index:300;animation:su .2s;max-width:340px}
.toast.err{border-left-color:#ef4444}
.toast.ok{border-left-color:#10b981}

/* LOGOUT CONFIRM */
.lo-c{max-width:360px;text-align:center;align-items:center}

/* USER CARDS */
.ug{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
.uc{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:16px 14px;display:flex;align-items:center;gap:12px;transition:border-color .15s}
.uc:hover{border-color:var(--border2)}
.uci{flex:1;min-width:0}
.ucn{font-size:14px;font-weight:700;color:var(--text0);margin-bottom:1px}
.uce{font-size:11px;color:var(--text2);font-family:var(--mono);margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.uca{display:flex;flex-direction:column;gap:4px;flex-shrink:0}

/* COLOR PICKER */
.cp{display:flex;gap:6px;flex-wrap:wrap;margin-top:3px}
.cd{width:22px;height:22px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:transform .15s,border-color .15s}
.cd:hover{transform:scale(1.18)}
.cd.sel{border-color:white;transform:scale(1.1)}

/* TOGGLE */
.trow{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:var(--bg2);border-radius:10px;border:1px solid var(--border)}
.tgl{width:40px;height:22px;border-radius:11px;border:none;cursor:pointer;transition:background .25s;position:relative;flex-shrink:0}
.tgl::after{content:'';position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .25s}
.tgl.on{background:var(--accent)}.tgl.on::after{left:21px}
.tgl.off{background:var(--bg4)}.tgl.off::after{left:3px}

/* TABLE */
.et{width:100%;border-collapse:collapse}
.et th{text-align:left;padding:8px 12px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);border-bottom:1px solid var(--border)}
.et td{padding:10px 12px;font-size:13px;color:var(--text1);border-bottom:1px solid var(--border)}
.et tr:last-child td{border-bottom:none}
.et tr:hover td{background:var(--bg2)}

/* EMPTY */
.em{text-align:center;padding:48px 20px;color:var(--text3)}
.ei{font-size:34px;margin-bottom:9px}
.et2{font-size:14px}

/* REMARKS */
.rmk{margin-top:10px;padding:10px 12px;background:var(--bg2);border-radius:8px;border:1px solid var(--border)}
.rmk-h{font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:8px;display:flex;align-items:center;justify-content:space-between}
.rmk-list{display:flex;flex-direction:column;gap:7px;margin-bottom:10px;max-height:240px;overflow-y:auto}
.rmk-it{display:flex;gap:8px;padding:7px 9px;background:var(--bg1);border-radius:7px;border:1px solid var(--border)}
.rmk-av{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0}
.rmk-bd{flex:1;min-width:0}
.rmk-mt{font-size:10px;color:var(--text3);display:flex;align-items:center;gap:6px;margin-bottom:2px}
.rmk-au{font-size:11px;font-weight:600;color:var(--text1)}
.rmk-tx{font-size:12px;color:var(--text1);line-height:1.45;word-wrap:break-word}
.rmk-del{background:none;border:none;color:var(--text3);font-size:11px;cursor:pointer;padding:2px 6px;border-radius:4px}
.rmk-del:hover{color:#ef4444;background:rgba(239,68,68,.08)}
.rmk-add{display:flex;gap:6px;align-items:flex-end}
.rmk-add textarea{flex:1;min-height:38px;resize:vertical;padding:7px 10px;background:var(--bg1);border:1px solid var(--border2);border-radius:7px;color:var(--text0);font-size:12px;outline:none;font-family:var(--font)}
.rmk-add textarea:focus{border-color:var(--accent)}
.rmk-add button{padding:7px 12px;background:var(--accent2);border:none;border-radius:7px;color:#fff;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap}
.rmk-add button:disabled{opacity:.5;cursor:not-allowed}
.rmk-empty{font-size:11px;color:var(--text3);text-align:center;padding:8px 0}

/* ACTIVITY */
.act-list{display:flex;flex-direction:column;gap:6px;max-height:280px;overflow-y:auto}
.act-it{display:flex;gap:8px;padding:7px 9px;background:var(--bg2);border-radius:7px;font-size:11px}
.act-av{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0}
.act-bd{flex:1;color:var(--text1);line-height:1.4}
.act-tm{color:var(--text3);font-size:10px}

/* LOADER */
.loader{display:flex;align-items:center;justify-content:center;min-height:60vh;color:var(--text2);font-size:14px;flex-direction:column;gap:12px}
.spinner{width:32px;height:32px;border:3px solid var(--bg3);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* SCROLLBAR */
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--bg4);border-radius:3px}

/* RESPONSIVE */
@media(max-width:960px){.sg{grid-template-columns:repeat(2,1fr)}.wg{grid-template-columns:repeat(4,1fr)}}
@media(max-width:700px){
  .topbar{display:flex}
  .sb{transform:translateX(-100%)}
  .sb.op{transform:translateX(0)}
  .sb-x{display:flex}
  .sb-ov.op{display:block}
  .main{margin-left:0;padding:16px 13px 60px}
  .sg{grid-template-columns:repeat(2,1fr);gap:9px}
  .wg{grid-template-columns:repeat(3,1fr)}
  .fr{grid-template-columns:1fr}
  .tr{padding:12px 14px;gap:9px}
  .ta{flex-direction:column}
  .lc{padding:30px 20px}
  .nc{padding:26px 20px}
  .ug{grid-template-columns:1fr}
}
@media(max-width:480px){
  .wg{grid-template-columns:repeat(2,1fr)}
  .sg{grid-template-columns:repeat(2,1fr)}
  .md{border-radius:14px}
}
`;
