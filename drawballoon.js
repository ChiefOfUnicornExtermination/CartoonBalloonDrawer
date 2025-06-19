/**
 * 二次元空間上の点
 * クラスにする必要も全くないがベクトルの基点からの位置座標と混乱して仕方ないのではっきりベクトルと関係ないと分かるようにクラス化しておく
 */
export class Point {
	constructor(param1, param2){
		if (typeof (param1) === "object" && param1.x && param1.y) {
			this.x = param1.x;
			this.y = param1.y;
		} else {
			this.x = param1;
			this.y = param2;
		}
	}
}

/**
 * 行列計算をするための、ただし二次元専用かつ今回の仕様に必要な要素だけに限定した超シンプル版簡易ベクトルクラス
 */
export class Vector2DSimple {
	constructor(r, m){
		if (typeof (r) === "object" && typeof(r.m) === "number" && typeof(r.r) === "number") m = r.m, r=r.r;
		if (typeof (r) === "object" && typeof(r.x) === "number" && typeof(r.y) === "number")　m=Eucrid(r.x, r.y), r = Math.atan2(r.y, r.x);
		this.r = (isNaN(r)?0:r) ?? 0,
		this.m = m ?? 1
	}
	get degree (){ return 360*this.r/(Math.PI*2)}
	set degree (d){ this.r =Math.PI*2*d/360 }
	// 現在の（加算前なら原点からのベクトル到達座標x、ｙ）
	get x(){return this.m*Math.cos(this.r)}
	set x(x){this.m = x/Math.cos(this.r) } // 角度を変えずに距離のほうだけ伸ばして渡されたxに到達するようにする
	get y(){return this.m*Math.sin(this.r)}
	set y(y){this.m = y/Math.sin(this.r)}
	set xy (xy) { this.r = Math.atan2(xy.y, xy.x); this.m=Eucrid(xy.x, xy.y) }
	set a(v){let added = this.add(v); this.r = added.r; this.m=added.m} // ベクトル合成。「自分に足す」ほう
	// ベクトル合成。「足したものを返す（自分自身は変えない）」ほう。どっちがどのメソッド名が一般的か知らないので逆だったりしたら直すかも
	add (v){
		return new Vector2DSimple(Math.atan2(this.y+v.y, this.x+v.x), Eucrid(this.x+v.x, this.y+v.y));
	}
	// スカラー倍。合成と同じく。用語が正しいかはよくわからん。直せたら直す
	mul (scalar) { this.m = this.m * scalar}
	multipicate (scalar) {
		return new Vector2DSimple({r: this.r, m: this.m*scalar});
	}
	rot (r) {this.r += r}
	rotate (r) {
		return new Vector2DSimple({r: this.r+r, m: this.m});
	}
}

/**
 * 線方向に対する進捗度合いごとの線
 * サンプル空間に描かれたようなこの線がフキダシなどの形状にパターンとして描かれることでパターンのある曲線を表現する
 * 線種の配列、その線種は基本的には進捗ごとの描画箇所の配列を返すが、「どこの点で」描くかなども変動するようにする場合はgetterにしてメソッド形式で戻り値としてそのデータを返す。
 * 引数は疑似コンテキストで渡されるので、この中にあるln（線を引く）やd.mv（線を引かずに移動）などを、同じく疑似コンテキスト内にあるd.size（線形状サイズ）などを用いて描画することで実現する
 * 例えば等間隔ギザギザなら例データの「ギザギザ」のように1: (d)=>{d.ln(1, 0)}とそのまま定数値をキーに固定の座標を返せばよい。これを引数のランダム（のような）値などによって散らばらせることで自然な乱れにする
 */
export const lines = {
	"simpleline" : {
		name: "直線で結ぶだけ",
		progresses: {
			0: (d) => {
					d.ln(0, 0);
				}
		}
	},
	"zigzag" : {
		name: "均一ギザギザ",
		defaultvalue: true,
		progresses: {
			0.5: (d) => {
					d.ln(0.5, 1);
				},
			1: (d) => {
					d.ln(1, 0);
				}
		}
	},
	"b2" : {
		name: "【未実装】粗いギザギザ",
		get progresses(){
			let retval = [];
			retval[1] = (d)=>{d.ln(1, 0);}
			retval[this.d.rnd*0.2] = (d)=>{d.ln(d.rnd*0.2, 3);}
			return retval;
		}
	},
	"c" : {
		name: "【未実装】曲線",
		progresses: {
			0: (d) => {
					d.ac(0, 0);
				}
		}
	},
	"d" : {
		name: "【未実装】てんてん",
		get progresses(){return {
			0.1: (d) => {
					d.mv(-0.5, 0.5);
					d.ln(0, 0);
					d.ln(0.5, -0.5);
					d.ln(0, -0.5);
					d.ln(-0.5, 0.5);
				},
			0.4: (d) => {
					d.mv(-0.3, 0.2);
					d.ln(0.1, 0.7);
					d.ln(1, -0.1);
					d.ln(1, -0.2);
					d.ln(-1, 0.5);
				},
		}}
	},
	"d" : {
		name: "【未実装】ハリネズミ",
		get progresses(){return {
			0.1: (d) => {
					d.mv(-0.5, 0.5);
					d.ln(0, 0);
					d.ln(0.5, -0.5);
					d.ln(0, -0.5);
					d.ln(-0.5, 0.5);
				},
			0.4: (d) => {
					d.mv(-0.3, 0.2);
					d.ln(0.1, 0.7);
					d.ln(1, -0.1);
					d.ln(1, -0.2);
					d.ln(-1, 0.5);
				},
		}}
	},
	"e" :  {
		name: "固定間隔の四角",
		get progresses() { }
	}
};


/**
 * シッポ線。フキダシの口から出てる場所のとがった部分
 * カスタマイズはあまりなく、指定の位置、角度に対して種類ごとの線を引くのみ。フキダシと比べたらかなりシンプル。線パターンはフキダシのものとは一致しない。ただし色、太さは共用する
 */
export const tails = {
	"simpleline" : {
		name: "直線で結ぶだけ",
		draw: function (start, end, top, d) {
			d.ctx.lineTo(start.x, start.y);
			d.ctx.lineTo(top.x, top.y);
			d.ctx.lineTo(end.x, end.y);
		}
	},
	// 【未実装】
	"curve1" : {
		name: "【未実装】円弧",
		draw: function (start, end, top, d) {
			d.ctx.lineTo(start.x, start.y);
			
			// シッポ開始位置と終了位置の中間点
			let C = new Point({x: (end.x-start.x)/2+start.x, y: (end.y-start.y)/2+start.y});
			// シッポ付け根中央からみて先端が右なら時計回り方向、左なら逆時計回り方向にふくらませる
			if (end.x-(start.x-end.x)/2<top.x) {
				// シッポ先端から付け根への中間線角度（書き出し側からみて。トータルはこれプラス書き出しatan）
			　　　let halfangle = (Math.atan2(start.y-end.y, start.x-end.x)-Math.atan2(start.y-top.y, start.x - top.x))/2;
			
				// （サンプル）中間点（距離としてみた場合の）へのベクトル
				let archtargetinner = new Vector2DSimple(start).add(new Vector2DSimple({r: Math.atan2(top.y-start.y, top.x-start.x), m: Eucrid(top, start)/2}));//.add(new Vector2DSimple({r: Math.atan2( top.x-start.x, top.y-start.y), m: Eucrid(C, start)/2}));
				// 第一引数にしっぽ付け根までの中間ベクトル―書き出しと先端への線分の間の垂直線の交点（※未実装。仮の記述）、第三引数はそれら点を周弧上に有する円の半径（※未実装。仮の記述）、第二引数はシッポ先端となる
				d.ctx.arcTo(archtargetinner.x, archtargetinner.y, top.x, top.y, Eucrid(top, start));
				// 外側に膨らませる場合は直線から見て逆方向に対称の点にする
				d.ctx.arcTo(archtargetinner.x, archtargetinner.y, end.x, end.y, Eucrid(top, start));
			} else {
				let archtargetinner = new Vector2DSimple(start).add(new Vector2DSimple({r: Math.atan2(top.y-start.y, top.x-start.x), m: Eucrid(top, start)/2}));//.add(new Vector2DSimple({r: Math.atan2( top.x-start.x, top.y-start.y), m: Eucrid(C, start)/2}));
				d.ctx.arcTo(archtargetinner.x, archtargetinner.y, top.x, top.y, Eucrid(top, start));
				d.ctx.arcTo(archtargetinner.x, archtargetinner.y, end.x, end.y, Eucrid(top, start));
			}
			d.ctx.lineTo(end.x, end.y);
		}
	},
	"curve2" : {
		name: "まるくまがる",
		draw: function (start, end, top, d) {
			d.ctx.lineTo(start.x, start.y);
			if (end.x-(start.x-end.x)/2<top.x) {
				d.ctx.bezierCurveTo((end.x-start.x)/2+start.x, (end.y-start.y)/2+start.y, top.x, top.y, top.x, top.y);
				d.ctx.bezierCurveTo(top.x, top.y, (end.x-start.x)*3/2+start.x, (end.y-start.y)*3/2+start.y, end.x, end.y);
			}else{
				d.ctx.bezierCurveTo((start.x-end.x)/2+start.x, (start.y-end.y)/2+start.y, top.x, top.y, top.x, top.y);
				d.ctx.bezierCurveTo(top.x, top.y, (end.x-start.x)/2+start.x, (end.y-start.y)/2+start.y, end.x, end.y);
			}
		}
	},
	"curve3" : {
		name: "曲線３（シャープ）",
		defaultvalue: true,
		draw: function (start, end, top, d) {
			d.ctx.lineTo(start.x, start.y);
			// 付け根（開始）点から先端方向への半分のベクトル
			let startToHalf = new Vector2DSimple({x: top.x-start.x, y: top.y-start.y}).multipicate(0.5);
			// 付け根（終了）点から先端方向への半分のベクトル
			let endToHalf = new Vector2DSimple({x: top.x-end.x, y: top.y-end.y}).multipicate(0.5);
			// フキダシの付け根(開始点から終了点へ)ベクトル
			let root = new Vector2DSimple({x: end.x-start.x, y: end.y-start.y});
			if (end.x-(start.x-end.x)/2<top.x) {
				let point1 = new Vector2DSimple(start).add(startToHalf).add(new Vector2DSimple({m: root.m/4, r: root.r}));
				let point2 = new Vector2DSimple(end).add(endToHalf).add(new Vector2DSimple({m: root.m/4, r: root.r}));
				d.ctx.bezierCurveTo(point1.x, point1.y, top.x, top.y, top.x, top.y);
				d.ctx.bezierCurveTo(top.x, top.y, point2.x, point2.y, end.x, end.y);
			}else{
				let point3 = new Vector2DSimple(start).add(startToHalf).add(new Vector2DSimple({m: root.m/4, r: root.r + Math.PI}));
				let point4 = new Vector2DSimple(end).add(endToHalf).add(new Vector2DSimple({m: root.m/4, r: root.r + Math.PI}));
				d.ctx.bezierCurveTo(point3.x, point3.y, top.x, top.y, top.x, top.y);
				d.ctx.bezierCurveTo(top.x, top.y, point4.x, point4.y, end.x, end.y);
			}
		},
	},
	"curve4" : {
		name: "ふきだす",
		draw: function (start, end, top, d) {
			d.ctx.lineTo(start.x, start.y);
			d.ctx.bezierCurveTo((end.x-start.x)/2+start.x, (end.y-start.y)/2+start.y, top.x, top.y, top.x, top.y);
			d.ctx.bezierCurveTo(top.x, top.y, (start.x-end.x)/2+end.x, (start.y-end.y)/2+end.y, end.x, end.y);
		}
	},
	//【未実装】
	"zigzag" : {
		name: "【未実装】カミナリ線",
		draw: function (start, end, top, d) {
			d.ctx.lineTo(start.x, start.y);
			d.ctx.lineTo(top.x, top.y);
			d.ctx.lineTo(end.x, end.y);
		}
	},
	//【未実装】
	"zagzig" : {
		name: "【未実装】縦カミナリ線",
		draw: function (start, end, top, d) {
			d.ctx.lineTo(start.x, start.y);
			d.ctx.lineTo(top.x, top.y);
			d.ctx.lineTo(end.x, end.y);
		}
	},
	"ovals" : {
		name: "複数の丸",
		draw: function (start, end, top, d) {
			// フキダシの中心地点
			let center = new Vector2DSimple(start).add(new Vector2DSimple({x: end.x-start.x, y: end.y-start.y}).multipicate(0.5));
			// フキダシ根元の真ん中から先端に向かうベクトル
			let v = new Vector2DSimple({x: top.x - center.x, y: top.y - center.y});
			
			// TBD: 書き出し地点（書き終わり地点？）に変な点が見える
			d.ctx.lineTo(start.x, start.y);
			d.ctx.closePath(); // 各ロジック内でパスだけ作って線描画や塗りは最後に共通処理で行うつもりだったけど下の線を塗り隠さないといけないので毎回線を閉じて描画する
			d.ctx.fill();
			d.ctx.stroke();
			d.ctx.beginPath();
			d.ctx.moveTo(center.add(v.multipicate(0.2)).x + Math.abs(start.x-end.x), center.add(v.multipicate(0.2)).y);
			d.ctx.ellipse(center.add(v.multipicate(0.2)).x, center.add(v.multipicate(0.2)).y, Math.abs(end.x-start.x), Math.abs(end.y-start.y), 0, 0, Math.PI*2);
			d.ctx.closePath();
			d.ctx.fill();
			d.ctx.stroke();
			d.ctx.beginPath();
			d.ctx.moveTo(center.add(v.multipicate(0.7)).x + Math.abs(start.x-end.x)*0.4, center.add(v.multipicate(0.7)).y);
			d.ctx.ellipse(center.add(v.multipicate(0.7)).x, center.add(v.multipicate(0.7)).y, Math.abs(end.x-start.x)*0.4, Math.abs(end.y-start.y)*0.4, 0, 0, Math.PI*2);
			d.ctx.closePath();
			d.ctx.fill();
			d.ctx.stroke();
			d.ctx.beginPath();
			d.ctx.moveTo(center.add(v).x + Math.abs(start.x-end.x)*3/10, center.add(v).y);
			d.ctx.ellipse(center.add(v).x, center.add(v).y, Math.abs(end.x-start.x)*0.3, Math.abs(end.y-start.y)*0.3, 0, 0, Math.PI*2);
			d.ctx.closePath();
			d.ctx.fill();
			d.ctx.stroke();
			//d.ctx.beginPath();
			
			d.ctx.moveTo(end.x, end.y);
		}
	}
};
/**
 * ２点間の距離の取得。そこらじゅうにでてくるのでこれ高速化したらパフォーマンス変わるかも
 */
export function Eucrid (arg1, arg2, x2, y2){
	let x = arg1, y = arg2;
	if (typeof arg1 === "object" && !isNaN(arg1.x)) x = arg1.x - (arg2?.x??0), y = arg1.y - (arg2?.y??0);
	else if (typeof x2 !== "undefined") x = arg1 - x2, y = arg2 - y2;
	return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}
/** 
* 一定範囲内にある角度を比較する便利メソッド。r2がr1～r1+rangeの範囲内かつ大きい場合にのみ正を返す
*/
let radianBiggerThan = function(r1, r2, range){
	r1 = (Math.PI*2+r1)%(Math.PI*2); // まず0～360度の範囲に整える※マイナス360度を超える範囲は対応できない。今回は多分問題にはならないけど何かいい方法あるのかな？（+Math.PI*200000とかすりゃいいんだろうけど）
	r2 = (Math.PI*2+r2)%(Math.PI*2);
	if (Math.abs(range+r1-r2)<0.00000001) return false; // 極小の無理数同士の計算が続くため、同一の値が端数によってわずかに大小が出たりする。本当に小さい差しかない場合は同一だったということでfalse
	if (r1<r2 && r2<r1+range) return true; // 基本パターン。普通に範囲内ならtrue。おめでとう
	if (r1<0 && r2<r1+range-Math.PI*2) return true; // r1が小さいので1周廻った範囲で比較
	if (Math.PI*2<r1+range && r2<r1+range-Math.PI*2) return true; // r1が大きいのでr2と同じだが1周廻った角度で比較
	return false;
}
/**
 * 渡された点＋原点からの角度の配列の中で、指定の角度よりも小さい最大のものを返す便利メソッド。
 * その際角度は１週廻ってゼロから始まっているものも含まれている可能性があるため、それも考慮に入れて「小さければ１周回した角度で」判断する
 */
let getBiggestRadianUpto = function(points, max, range) {
	let biggest;
	for (let i in points) {
		if (!points[i]) continue;
		if (radianBiggerThan(points[i].angle, max, range)) {
			if (!biggest) biggest = points[i];
			if (radianBiggerThan(biggest.angle, points[i].angle, range) && radianBiggerThan(points[i].angle, max, range)) { range = range-points[i].angle+biggest.angle; biggest = points[i] }; // 「更新されて次を比較する」関係上、次の比較範囲はMAXからMAX＋（本来の範囲角度-現MAX）に更新する。そうしないと更新されたMAXからの規定範囲として次を取得してしまい本来範囲外だったものを対象としてしまう
		}
	}
	if (biggest) return new Point({x: biggest.x, y: biggest.y});
};
/**
 * 点集合の最小角と最大角を取得する便利メソッド
 */
let getRange = function(points, range) {
	let smallest = null, biggest = null;
	for (let i in points) {
		if (!points[i]) continue;
		if (!smallest) smallest = points[i];
		if (!biggest) biggest = points[i];
		if (radianBiggerThan(biggest.angle, points[i].angle, range)) biggest = points[i];
		if (radianBiggerThan(points[i].angle, smallest.angle, range)) smallest = points[i];
	}
	
	return {start: smallest, end: biggest};
}

/**
 * フキダシ図形（ガワ）の定義
 * この図形の周囲をそれぞれのパターンの線で描くことでフキダシの描画を実現する。
 * 軌跡メソッドでは割合だけ返して呼んだ側で拡大扁平して調整する感じにするつもりだったけどキモである四角楕円を描くための４焦点問題が直接の解なくて総当たりするしかないので誤差を減らすためにこっちで実使用サイズの線として返すメソッドにした
 * プロパティのtraceがyieldで、これに引数を与えて実行した結果がnext()するごとに１単位ごとの描画用データ（およびメソッド）を返す。
 */
export const balloons = {
	"four-focused-ovalrect": {
		name: "四焦点角楕円",
		defaultvalue: true,
		trace: function* (starttheta, endtheta, step, b){
			let returnarray = [];
			let range = {};
			let dots = [];
			
			// 総当たりで四角楕円の周上っぽい点を取得。ただし本当の総当たりではなく「それっぽい範囲」を先に絞り込んでおく。計算上中心より縦＋横分以上に離れることはない…よね？
			let possiblearea_xmin = b.position.x-b.rect.width-b.rect.height/2-b.c/2;
			let possiblearea_xmax = b.position.x+b.rect.width+b.rect.height/2+b.c/2;
			let possiblearea_ymin = b.position.y-b.rect.width/2-b.rect.height-b.c/2;
			let possiblearea_ymax = b.position.y+b.rect.width/2+b.rect.height+b.c/2;
			possiblearea_xmin = possiblearea_xmin < 0 ? 0 : possiblearea_xmin;
			possiblearea_xmax = b.canvassize.width < possiblearea_xmax ? b.canvassize.width : possiblearea_xmax;
			possiblearea_ymin = possiblearea_ymin < 0 ? 0 : possiblearea_ymin;
			possiblearea_ymax = b.canvassize.height < possiblearea_ymax ? b.canvassize.height : possiblearea_ymax;
			// 画面領域をはみ出す部分があるフキダシがぶっ壊れるので、ちょっとだけ画面サイズを超えて取得（総当たりで点を取るロジックの関係上、完璧は無理。バカでかいフキダシ描いたらやっぱりぶっこわれる）。100にしたらあからさまにパフォーマンスが落ちたのでみみっちく40
			possiblearea_xmin -= 40;
			possiblearea_xmax += 40;
			possiblearea_ymin -= 40;
			possiblearea_ymax += 40;
			for (let y=possiblearea_ymin; y<possiblearea_ymax; y+= 1) {
				for (let x=possiblearea_xmin; x<possiblearea_xmax; x+= 1) {
					// 範囲を削って少しでも計算回数を減らす（意味ないかなぁ…むしろ遅くなる？）
					if (b.position.x-b.rect.width/2<x&&x<b.position.x+b.rect.width/2&&b.position.y-b.rect.height/2<y&&y<b.position.y+b.rect.height/2) continue;

					if (
					Math.abs(b.c + b.rect.width + b.rect.height + Math.sqrt(Math.pow(b.rect.width, 2) + Math.pow(b.rect.height, 2)) - (
						Eucrid(x, y, b.position.x-b.rect.width/2, b.position.y-b.rect.height/2) + 
						Eucrid(x, y, b.position.x-b.rect.width/2, b.position.y+b.rect.height/2) + 
						Eucrid(x, y, b.position.x+b.rect.width/2, b.position.y+b.rect.height/2) + 
						Eucrid(x, y, b.position.x+b.rect.width/2, b.position.y-b.rect.height/2)
					))< 2 // しょせん「1刻みで点が計算と合致するか」見てるだけなので、ピッタリ同一になることはほとんどない。==b.cではなくてb.cから引いた結果がプラマイある程度以下になっている場合にじゅうぶん近いと判断する
					) dots.push({x: x, y: y, angle: (Math.PI*2+Math.atan2(y-b.position.y,x-b.position.x))%(Math.PI*2)}); // あとで比較しやすいように正の数にそろえておく。形式は似ているがベクトルではないので注意
					// 詳細な点の集合を打って範囲と思われる場所を一定誤差内で取得するだけなので、当然線には「太さ（同じ地点の進行方向に対して同一座標→原点方向に違う座標）」が出る。
					// それらを次の点として描画してしまうと嫌なので（ものすごく細かいギザギザとなってしまう）、それっぽい点(中心から見て差が45度以下くらいの傾き)があるようなら除外。
					// …という処理を入れようかと思ったけどどうせあとで「範囲内で一番大きい一つの点」で取得するためやめた。先に除外して少ない中からピックアップするか乱雑に多量にある中から最大とるかどっちが負荷でかいか次第でやっぱり入れることにするかも
					//for (let dotindex in dots) {
					//	if (dots[dotindex].x) {
					//		…
					//	}
					//}
				}
			}
			
			// 割合（0~1）を渡されたら該当の点を返すメソッド
			let returnfunc = function(progress) {
				return getBiggestRadianUpto(returnarray, range.start.angle + step * progress, step)
			}
			
			// 指定位置から一周分まわる。比較しやすいように360度を超えても361度…のような数値で表していく
			for (let cursor = starttheta; cursor < endtheta-step; cursor+= step) {
				returnarray = []; // 戻り値をリセット。最後にハンパ分も返したいのでここで定義はせずにメソッド冒頭で定義する
				range = {};
				// stepきざみで周をまわり、その単位の中でさらに詳細度合い単位で取得。…っていらないか？どうせstepごとに返せばいいからそれまでの全部出せばいいのか？
				//for (let tick = cursor; tick < cursor+step; tick+= fineness) {
					// 収集してきた点集合を確認し、範囲に含まれるものをすべて取得して結果の中にいれる。処理の関係上「今の点から次までの範囲」となるため最後は少しオーバーする。そうなっては困る処理を書かないように
					for (let dotindex in dots){
						// 「その点が今のカーソル以上今のカーソル＋stepまでの範囲にあるようなら、返せ」だけの話だけど、角度が周を回るもので大小とかないものだから計算はめっちゃめんどくなる。結局外メソッドにした。負荷でかいかなぁ…
						if(radianBiggerThan(cursor, dots[dotindex].angle, step)){
							returnarray.push(dots[dotindex]);
						}
					}
					if (returnarray?.length) {
						range = getRange(returnarray, step);
						// 渡されたstep単位ごとにそれまでの範囲で収集してきた点集合を参照できる描画用オブジェクトを返す。dots[i]の型はベクトル型と似ていて間違えやすい（開発中何度も取り違えミスでバグだした）ので、バラしてそれぞれの値としてプロパティに詰める
						yield {startangle: range.start.angle, endangle: range.end.angle, startpoint: new Point({x: range.start.x, y: range.start.y}), endpoint: new Point({x: range.end.x, y: range.end.y}), obtainpoint: returnfunc};
						
					} else {
						// 形状によってはステップ内にひとつも点が存在しないこともある。その場合はnullを返して呼び元側でさばいてもらう
						yield null;
					}
				//}
			}
			if (range?.start) { // 「積み残し」がある場合（普通はある）は最後にその分を返す
				yield {startangle: range.start.angle, endangle: range.end.angle, startpoint: new Point({x: range.start.x, y: range.start.y}), endpoint: new Point({x: range.end.x, y: range.end.y}), obtainpoint: returnfunc, laststep: true};
			}
		}
	},
	"sixovals": {
		name: "【未実装】六楕円",
		trace: function* (starttheta, endtheta, step, b){
		// 【作成中】
		//	let r = Eucrid(b.rect.width, b.rect.height)/2;
		//	let x_left = b.rect.x-b.rect.width/2;
		//	let x_right = b.rect.x+b.rect.width/2;
		//	let y_top = b.rect.y-b.rect.height/2;
		//	let y_bottom = b.rect.y+b.rect.height/2;
		//	for (let cursor = starttheta; cursor < Math.PI*2; cursor += step){
		//		if (Math.acos(cursor) * r < x_left && Math.asin(cursor) * r < y_top) {
		//			yield ({x: , y: ,r: });
		//		}
		//	}
		}
	},
	"rectangle": {
		name: "長方形",
		trace: function* (starttheta, endtheta, step, b){
			// 戻り値１セットの中で現在の点だけではなくて終了点や割合ごとの途中の点を返すデザインにしてしまった（主に上の「四焦点楕円」に使う４焦点問題が公式化できないため。やり方見出したらこの辺まるっと変えます）ため、ループで回してcursor位置の場合分けで返したりしようとすると「始まりはこの線上だったけど途中で曲がって次の線にいった」を取れず行き過ぎてしまうため、別個で点返しメソッドをつくる。
			let getPointAroundRect = function(angle){
				angle = angle%(Math.PI*2);
				if (Math.atan2(b.rect.height, b.rect.width) < angle && angle < Math.atan2(b.rect.height, -b.rect.width)) {
					return new Point({x: b.position.x + Math.cos(angle)* Eucrid(b.rect.width/2, b.rect.height/2), y:b.position.y + b.rect.height/2});
				}
				if (Math.atan2(b.rect.height, -b.rect.width) <= angle && angle <= (Math.atan2(-b.rect.height, -b.rect.width)+Math.PI*2)) {
					return new Point({x: b.position.x - b.rect.width/2, y: Math.sin(angle)* Eucrid(b.rect.width/2, b.rect.height/2) + b.position.y});
					
				}
				if (Math.atan2(-b.rect.height, -b.rect.width) + Math.PI*2 < angle && angle < Math.atan2(-b.rect.height, b.rect.width) + Math.PI*2) {
					return new Point({x: b.position.x + Math.cos(angle)* Eucrid(b.rect.width/2, b.rect.height/2), y: b.position.y - b.rect.height/2});
				}
				if ((Math.atan2(-b.rect.height, b.rect.width) + Math.PI*2 < angle && angle < Math.atan2(b.rect.height, b.rect.width)+Math.PI*2) || 
					(Math.atan2(-b.rect.height, b.rect.width) <= angle && angle <= Math.atan2(b.rect.height, b.rect.width))) {
					return new Point({x: b.position.x + b.rect.width/2, y: Math.sin(angle)* Eucrid(b.rect.width/2, b.rect.height/2) + b.position.y});
				}
			}
			let cursor;
			for (cursor = starttheta; cursor < endtheta-step; cursor+= step) {
				yield {startangle: cursor, endangle: cursor+step, startpoint: getPointAroundRect(cursor), endpoint: getPointAroundRect(cursor+step), obtainpoint: (progress)=> getPointAroundRect(cursor+parseFloat(progress)*step)};
			}
			yield {startangle: endtheta%step, endangle: endtheta, startpoint: getPointAroundRect(endtheta%step), endpoint: getPointAroundRect(endtheta), obtainpoint: (progress) => getPointAroundRect(cursor+parseFloat(progress)*step), laststep: true};
		}
	},
	"oval": {
		name: "【仮実装】楕円（二焦点）",
		trace: function* (starttheta, endtheta, step, b){
			let cursor;
			//let aspect = isNaN(b.c_a)||b.c_a===0?1:Math.abs(b.c_a); // 一応「常に正の値」としてはいるものの、どんな値が来るかわからないので念のため絶対値をとったうえでゼロなら１扱いする
			let focus_a = new Point(0, 0); // 上側もしくは左側の焦点(中心点からの座標)
			let focus_b = new Point(0, 0); // 下側もしくは右側の焦点(中心点からの座標)
			//if (aspect < 1) {
			//	focus_a.y = b.position.y;
			//	focus_b.y = b.position.y;
			//	focus_a.x = b.position.x + Eucrid(b.rect.width, b.rect.height) * (1/aspect-1);
			//	focus_b.x = b.position.x - Eucrid(b.rect.width, b.rect.height) * (1/aspect-1);
			//} else {
			//	focus_a.x = b.position.x;
			//	focus_b.x = b.position.x;
			//	focus_a.y = b.position.y + Eucrid(b.rect.width, b.rect.height) * (aspect -1); // 正しい比率になってない。後で考える
			//	focus_b.y = b.position.y - Eucrid(b.rect.width, b.rect.height) * (aspect -1);
			//}
			// ↑やめ。楕円形は当然どんな比率の矩形でも内包するので「でっぱり扁平率」を別途設定してそこから計算するデザインにするつもりだったが、ユーザーが縦長の長方形を描画してそれに合う楕円って言ってんのに横長楕円描くのはやっぱりおかしい。
			// これを自分とこ持ってってカスタマイズしたり拡張したりする人はこの辺を修正すること
			if (b.rect.width<b.rect.height) {
				focus_a.x = b.position.x;
				focus_b.x = b.position.x;
				focus_a.y = b.position.y + Eucrid(b.rect.width, b.rect.height) * (b.rect.height/b.rect.width)/4;
				focus_b.y = b.position.y - Eucrid(b.rect.width, b.rect.height) * (b.rect.height/b.rect.width)/4;
			} else {
				focus_a.x = b.position.x + Eucrid(b.rect.width, b.rect.height) * (b.rect.width/b.rect.height)/4;
				focus_b.x = b.position.x - Eucrid(b.rect.width, b.rect.height) * (b.rect.width/b.rect.height)/4;
				focus_a.y = b.position.y;
				focus_b.y = b.position.y;
			}
			
			let returnarray = [];
			let range = {};
			let dots = [];
			// 本当はちゃんと計算してθに対する値を直接返すメソッドにする。計算式ができないのでいまのところ四焦点楕円（こっちは一般式化できないので仕方ない）と同じように点を取って返す仮仕様にしておく
			let possiblearea_xmin = -40;
			let possiblearea_xmax = b.canvassize.width + 40;
			let possiblearea_ymin = -40;
			let possiblearea_ymax = b.canvassize.height + 40;
			for (let y=possiblearea_ymin; y<possiblearea_ymax; y+= 1) {
				for (let x=possiblearea_xmin; x<possiblearea_xmax; x+= 1) {
					if (Math.abs(Eucrid({x:x,y:y}, focus_a) + Eucrid({x:x,y:y}, focus_b) - b.c*Eucrid(focus_a, focus_b)/16)< 2)　dots.push({x: x, y: y, angle: (Math.PI*2+Math.atan2(y-b.position.y,x-b.position.x))%(Math.PI*2)});
				}
			}
			
			let returnfunc = function(progress) {
				return getBiggestRadianUpto(returnarray, range.start.angle + step * progress, step)
			}
			
			for (let cursor = starttheta; cursor < endtheta-step; cursor+= step) {
				returnarray = [];
				range = {};
				for (let dotindex in dots){
					if(radianBiggerThan(cursor, dots[dotindex].angle, step)) returnarray.push(dots[dotindex]);
				}
				if (returnarray?.length) {
					range = getRange(returnarray, step);
					yield {startangle: range.start.angle, endangle: range.end.angle, startpoint: new Point({x: range.start.x, y: range.start.y}), endpoint: new Point({x: range.end.x, y: range.end.y}), obtainpoint: returnfunc};
					
				} else {
					yield null;
				}
			}
			if (range?.start) {
				yield {startangle: range.start.angle, endangle: range.end.angle, startpoint: new Point({x: range.start.x, y: range.start.y}), endpoint: new Point({x: range.end.x, y: range.end.y}), obtainpoint: returnfunc, laststep: true};
			}
			
			
			
			
			// こっちが作りかけの本当のメソッド。本当はこんな感じにする予定
			//for (cursor = starttheta; cursor < endtheta-step; cursor+= step) {
			//	
			//	
			//	yield {startangle: cursor, endangle: cursor+step, startpoint: getPointAroundRect(cursor), endpoint: getPointAroundRect(cursor+step), obtainpoint: (progress)=> getPointAroundRect(cursor+parseFloat(progress)*step)};
			//}
			//yield {startangle: endtheta%step, endangle: endtheta, startpoint: getPointAroundRect(endtheta%step), endpoint: getPointAroundRect(endtheta), obtainpoint: (progress) => getPointAroundRect(cursor+parseFloat(progress)*step), laststep: true};
		}
	},
	"superrect": {
		name: "【仮実装】スーパー四角",
		trace: function* (starttheta, endtheta, step, b){
			let returnarray = [];
			let range = {};
			let dots = [];
			// 上記同様。一般公式化できるものなので、θを渡されたら該当の点を返すだけのメソッドに直す。いずれ。
			let possiblearea_xmin = -40;
			let possiblearea_xmax = b.canvassize.width + 40;
			let possiblearea_ymin = -40;
			let possiblearea_ymax = b.canvassize.height + 40;
			for (let y=possiblearea_ymin; y<possiblearea_ymax; y+= 1) {
				for (let x=possiblearea_xmin; x<possiblearea_xmax; x+= 1) {
					if (Math.abs(Math.pow(Math.abs((x-b.position.x)*2/b.rect.width),3)+ Math.pow(Math.abs((y-b.position.y)*2/b.rect.height),3)-1)<0.01) dots.push({x: x, y: y, angle: (Math.PI*2+Math.atan2(y-b.position.y,x-b.position.x))%(Math.PI*2)});
				}
			}
			
			let returnfunc = function(progress) {
				return getBiggestRadianUpto(returnarray, range.start.angle + step * progress, step)
			}
			
			for (let cursor = starttheta; cursor < endtheta-step; cursor+= step) {
				returnarray = [];
				range = {};
				for (let dotindex in dots){
					if(radianBiggerThan(cursor, dots[dotindex].angle, step)) returnarray.push(dots[dotindex]);
				}
				if (returnarray?.length) {
					range = getRange(returnarray, step);
					yield {startangle: range.start.angle, endangle: range.end.angle, startpoint: new Point({x: range.start.x, y: range.start.y}), endpoint: new Point({x: range.end.x, y: range.end.y}), obtainpoint: returnfunc};
					
				} else {
					yield null;
				}
			}
			if (range?.start) {
				yield {startangle: range.start.angle, endangle: range.end.angle, startpoint: new Point({x: range.start.x, y: range.start.y}), endpoint: new Point({x: range.end.x, y: range.end.y}), obtainpoint: returnfunc, laststep: true};
			}
		}
	},
	"roundrect": {
		name: "【未実装】丸四角",
		trace: function* (starttheta, endtheta, step, b){
		}
	}
}

/**
 * 描画オブジェクト。コンテキストの代替として、進行方向ベクトルを見ながらコンテキストに描くかのような使い方を中継する
 */
export class DrawingContext {
	constructor(ctx, param){
		this.ctx = ctx;
		this.canvassize = {width: ctx.canvas.offsetWidth, height: ctx.canvas.offsetHeight};
		this.position = param.position??{x: 0,y: 0}; // パラメーターからコピーされた中心点。「外側に行けば行くほど」のような図形が描きたいときに使うかも？この値を書き換えてもフキダシ位置が変わったりはしない
		this.rect = param.rect??{width: 0, height: 0}; // 基準となる（基本的には線が遮ることのない）四角形。高さ幅。中心地同様、参照用でこれを変えても形を変えるわけではない
		this.t_h = param.t_h??4; // 線分の太さ_太い場所・0～1空間上にあるものの、別に1以上の太さの線になっても構わない
		this.t_n = param.t_n??2; // 線分の太さ_細い場所（簡略のため「細さ」として説明したりする値）
		this.c = param.c??20; // ふくらみ幅。角丸図形のradiusに近いイメージ。元の矩形からどの程度の余裕をもって曲線が引かれるか
		this.c_a = param.c_a??20; // ふくらみ幅横縦比率。図形によってx方向y方向別々の値をもとに描画するため、その場合のみ使われる。メインの４焦点楕円や６楕円では使われない。常に正の値で、１が縦横同比率。少数以下が横のほうが縦より長く、１以上は縦のほうが横より長い
		this.next = null; // 線を引く先の位置。
		this.current = null; // 線を引く元の位置。ループ処理では一つ前の点にあたる
		this.previous = null; // 曲線計算用、ひとつ前の地点
		this.caret = null; // 描画キャレット。コンテキストで今描いている点のベクトル
		this.size = param.size??40; // 進行方向の垂直にどれほど拡大するか
		this.rndseed = param.rndseed??5;
		this.rnd = param.rnd; // ランダム係数のように使える乱れ値。実際はランダムではなくrndseedの値によって一意に定まる
	}
	// 線を引かずに移動
	mv(x, y) {
		if (!this.next) return;
		let linedpoint = new Vector2DSimple(this.current).add( new Vector2DSimple({x: x*Eucrid(this.startpoint, this.endpoint)-Eucrid(this.startpoint, this.next), y: y*this.size}).rotate(this.caret.r + Math.PI));
		this.ctx.moveTo(linedpoint.x, linedpoint.y);
	}
	// 直線
	ln(x, y){
		if (!this.next) return;
		// x方向には「実際今いる場所の割合（現在位置からstep開始時点の位置から引いたもの/全体距離）を指定の割合から引いた値（等速進行位置からのズレ）かけるstepで要する距離」を指定。y方向はそのままsize倍するだけ
		// これを現在地点の角度に回転させると曲線上での線パターンの前後ずれ&中心/外偏移分になる。曲線状のキャレットにそれを足したものが線パターンの頂点。実際は本来曲線なので（直線）距離の計算では差異が出るが、許容する。
		let linedpoint = new Vector2DSimple(this.next).add( new Vector2DSimple({x: x*Eucrid(this.startpoint, this.endpoint)-Eucrid(this.startpoint, this.next), y: y*this.size}).rotate(this.caret.r + Math.PI));
		this.ctx.lineTo(linedpoint.x, linedpoint.y);
	}
	// 【作成中】広がる曲線
	po(x, y, b) {
		// 中心から外に行く方向、均等な方向線かつxyに指定された座標をとおる線になるベジエを描く。
//		let n = new Vector2DSimple({x: x*Eucrid(this.startpoint, this.endpoint)-Eucrid(this.next, this.startpoint), y: y*this.size});
//		n.r += this.caret.r+Math.PI;
//		this.ctx.bezierCurveTo(, this.next.x, this.next.y);
	}
	// 【作成中】滑らか曲線
	ac(x, y) {
		let n = new Vector2DSimple({x: x*this.size, y: y*this.size});
		n.r += this.caret.r + Math.PI/2;
		// お手製滑らか曲線描画用中間点取得メソッドをつかってbezierCurveToを引く。ただし「ひとつまえ」「ふたつまえ」ありきの計算なので最初の２回は円弧や疑似滑らか曲線にする。本来は「戻って引き直し」すべきだがそこまではしない（出来上がりの不自然さ次第でしなきゃいけなくなるかも…）
		if (!this.current) {
			this.ctx.arcTo(this.next.x, this.next.y, this.caret.add(n).x, this.caret.add(n).y, Eucrid(this.next.x, this.next.y, this.caret.add(n).x, this.caret.add(n).y));
		} else if (!this.previous || !this.previous2) {
			this.ctx.moveTo(this.current.x, this.current.y);
			this.ctx.fillStyle = "orange";
			this.ctx.fillRect(this.current.x, this.current.y, 8, 8);
			this.ctx.fillStyle = "green";
			this.ctx.fillRect(this.next.x, this.next.y, 8, 8);
			this.ctx.fillStyle = "red";
			this.ctx.fillRect(this.caret.add(n).x, this.caret.add(n).y, 8, 8);
			this.ctx.lineTo(this.current.x, this.current.y);
		} else {
			let middlepoints_p = getMiddlePoint(this.previous2.x, this.previous2.y, this.previous.x, this.previous.y, this.current.x, this.current.y);
			let middlepoints_n = getMiddlePoint(this.previous.x, this.previous.y, this.current.x, this.current.y, this.next.add(n).x, this.next.add(n).y);
			this.ctx.bezierCurveTo (middlepoints_p[2], middlepoints_p[3], middlepoints_n[0], middlepoints_n[1], this.current.x, this.current.y);
			// current(実際はひとつまえ)までを引く計算なので（「次」はそのあとどこへ向かうかわからないのでまだ滑らかな線が引けない）、ループ終了後に引ききれなかった分を引いてもらうために積み残しを残す
			// TODO: このあとでac以外が呼ばれていたら…などのパターンが消化できない。要再考
			let ctx = this.ctx;
			this.leftover = function (){ctx.quadraticCurveTo (middlepoints_n[2], middlepoints_n[3], d.next.x, d.next.y);}
		}
	}
	// 【作成中】常に垂直方向に引く線
	vl(x, y, l){
	}
	// 【作成中】常に水平方向に引く線
	hl(x,y, l){}
	// 【作成中】線分の進行方向に対して引く線
	fl(x,y){}
}

/**
 * メイン処理
 */
export function drawBalloon (ctx, balloonparam, lineparam){
	let drawingparam = {
		position: { x: parseFloat(balloonparam.position.x), y: parseFloat(balloonparam.position.y) },
		rect: { width: Math.abs(balloonparam.rect.width), height: Math.abs(balloonparam.rect.height) },
		c: parseFloat(balloonparam.swellity * (Math.abs(balloonparam.rect.width) + Math.abs(balloonparam.rect.height))/20),
		c_a: balloonparam.swellAspect,
		size: lineparam.size
	}
	ctx.fillStyle = balloonparam.color??"white";
	if (!isNaN(lineparam.opacity)) {
		ctx.globalAlpha = parseFloat(lineparam.opacity);
	}
	ctx.strokeStyle = lineparam.color??"black";
	ctx.lineWidth = lineparam.thickness??1;
	let d = new DrawingContext(ctx, drawingparam);
	let tailthickness = parseFloat(balloonparam.tail?.width??0);
	let starttheta = (Math.PI*2 + parseFloat(balloonparam.tail?.angle??0))%(Math.PI*2) + (tailthickness??0)/2;
	let endtheta = Math.PI*2 + starttheta - (tailthickness??0);
	
	if (!balloonparam.type) balloonparam.type = Object.keys(balloons).find((balloontype)=>balloons[balloontype].defaultvalue);
	if (!lineparam.type) lineparam.type = Object.keys(lines).find((linetype)=>lines[linetype].defaultvalue);
	let trace = balloons[balloonparam.type].trace(starttheta, endtheta, lineparam.step, d);
	let line = lines[lineparam.type];
	let archinfo;
	let firstpoint;
	balloonloop: while (!(archinfo = trace.next()).done) {
		if (archinfo.value) { // 曲線のポイントが取得できなかった（主に小さすぎる矩形）場合は次にいってしまう…でいいのかなぁ。要再考
			// 現在stepの場所から次まで１step分の線パターンの描画
			line.d = d;
			d.startangle = archinfo.value.startangle;
			d.endangle = archinfo.value.endangle;
			d.startpoint = archinfo.value.startpoint;
			d.endpoint = archinfo.value.endpoint;
			lineloop: for (let progressindex = 0; progressindex < Object.keys(line.progresses).length; progressindex++) {
				// TMP: テストしてる環境であるChromeのjavascriptの不具合で間違いないと思うんだけどnew array[]に詰め替えてsort()すると[0.3: function(){}, 0.6: function(){}, 1: function(){}]だった配列が[0: function(){},0.3: function(){}, 0.6: function(){}]にされる。
				// わけわからんけどゴネてても仕方ないのでキーを別でループにしてソートをわざわざ差し込んでそれで対応する（そもそも配列やオブジェクトの使い方として度合いをキーにするとか邪道だからしゃーないけど）。
				// for (let linestep in line.progresses)で回してline.progresses[linestep]で実行という美しいコードだったのに…仕様不備が憎い…
				let linestep = Object.keys(line.progresses).sort()[progressindex];
				// 最後のステップ
				if (archinfo.value.laststep) { // ちょっと誤差も出るので調整
					// 最後の余りは構造上何をどうやっても不自然にはなる。仕方ないので最後の差の部分だけの縮小版ステップを刻んで小さめの線描画をして間を埋める（実際一般的な漫画でもフキダシのシッポ近辺や線の引き始めと引き終わりの間などでやってることなのでそこまでおかしくはないはず）
					let currentangle = Math.atan2(d.previous.y - d.position.y, d.previous.x - d.position.x);
					let lastangle = endtheta;
					if (balloonparam.tail) {
						lastangle = (Math.PI*2 + parseFloat(balloonparam.tail.angle??0) - tailthickness/2)%(Math.PI*2);
					}else {
						lastangle = endtheta;
					}
					let gapradian = (Math.PI*2 - (currentangle+Math.PI*2)%(Math.PI*2) + (lastangle + Math.PI*2)%(Math.PI*2))%(Math.PI*2) // 最後の差の角度取得。どちらかマイナスになっていたり2π度超えていることも考えられるため、2πの余り同士で計算する
					
					d.size = d.size*gapradian/lineparam.step;
					let laststepdrawer = balloons[balloonparam.type].trace(currentangle, lastangle, gapradian, d);
					let laststep = laststepdrawer.next()?.value;
					if (laststep) { // この値が取れないことも普通にあるはず。この不自然な処理をする必要なくstep刻みでぴったり（シッポがある場合はシッポの付け根から反対側の付け根まで）一周できたということなのでたいへんめでたい。そうじゃない場合はこの残りの処理をする
						d.startangle = laststep.startangle;
						d.endangle = laststep.endangle;
						d.startpoint = laststep.startpoint;
						d.endpoint = laststep.endpoint;
						// ステップはそれまでしていた描画のステップ番目を踏襲する。ギザギザの山と谷の順番を守りたいと言えばわかりやすい？
						d.next = laststep.obtainpoint(linestep);
						if (d.next) {
							d.caret = new Vector2DSimple({r: currentangle + Math.PI/2, m: Eucrid(d.previous, d.next)});
						} else {
							d.caret = new Vector2DSimple({r: currentangle + Math.PI/2, m: Eucrid(d.previous, d.current)});
						}
						line.progresses[linestep](d);
					}
					// フキダシ描画などで使う可能性があるので変更したサイズ値を本来の値に戻しておく
					d.size = lineparam.size;
					break balloonloop;
				}
				
				// フキダシ上の詳細座標群のうち、今回の描画範囲の中で最も（角度的に）大きな点を取得
				d.next = archinfo.value.obtainpoint(linestep);
				if (!d.next) d.next = archinfo.value.startpoint; // TODO: 最後というわけでもないけど範囲内に点がない場合（特に線を0時点で指定した場合は普通）には最小の点としてしまって…いいかなぁ？要再考
				// 「最初の点」の場合は現在地点として取得点集合内最小値をセットする
				if (!d.current) {
					ctx.beginPath();
					ctx.moveTo(archinfo.value.startpoint.x, archinfo.value.startpoint.y);
					d.current = archinfo.value.startpoint;
					firstpoint = d.current;
				}
				// 線を引く角度。本当は曲線的に取得して接線の角度をきちんと算出すべきだけど、使用方法上そこまでの違いはないので「前のプロット点からの直線的角度」にする
				d.caret = new Vector2DSimple(Math.atan2(d.next.y - d.current.y, d.next.x - d.current.x), Eucrid(d.current, d.next));
				line.progresses[linestep](d); // 各点の線/曲線を引く（実際は周囲を回る座標系からキャンバス上に変換して描くコンテキスト代替が読み替えて描く）
				
				d.previous2 = d.previous;
				d.previous = d.current;
				d.current = d.next;
			}
		}
	}
	if (d.leftover && typeof (d.leftover) === "function") d.leftover();
	
	if (balloonparam.tail) {
		let tailstarttheta = (Math.PI*2 + parseFloat(balloonparam.tail.angle??0) - tailthickness/2)%(Math.PI*2);
		let tailendtheta = Math.PI*2 + tailstarttheta + tailthickness/2;
		let tailarea = balloons[balloonparam.type].trace(tailstarttheta, tailendtheta, tailthickness, d).next().value;
		if (tailarea) {
			let taillength = balloonparam.tail.length*Eucrid(balloonparam.rect.height, balloonparam.rect.width);
			let tailmiddlepoint = tailarea.obtainpoint(0.5);
			let tailtop = new Vector2DSimple({x: tailmiddlepoint.x, y: tailmiddlepoint.y}).add(new Vector2DSimple({m: taillength, r: parseFloat(balloonparam.tail.direction)}));
			// シッポ定義はメソッド直呼び。そのまま必要な値を渡して描かせるのみ
			let tail = tails[balloonparam.tail.type]??Object.keys(tails).find((tailname)=>tails[tailname].defaultvalue);
			tail.draw(tailarea.startpoint, tailarea.endpoint, tailtop, d);
			// シッポ描画処理の中でどのシッポを選んでも終点まで引くようになっているはずだが、念のため結んでおく
			ctx.lineTo(tailarea.endpoint.x, tailarea.endpoint.y);
			ctx.lineTo(firstpoint.x, firstpoint.y);
		} else if (firstpoint) {
			// シッポ取得失敗。それでもフキダシが壊れすぎないように、最初の点まで線を引く
			ctx.lineTo(firstpoint.x, firstpoint.y);
		}
	} else {
		ctx.lineTo(firstpoint.x, firstpoint.y);
	}
	
	ctx.save();
	if (!isNaN(balloonparam.opacity)) {
		ctx.globalAlpha = parseFloat(balloonparam.opacity);
	}
	ctx.fill();
	ctx.restore();
	
	ctx.save();
	if (!isNaN(lineparam.opacity)) {
		ctx.globalAlpha = parseFloat(lineparam.opacity);
	}
	ctx.strokeStyle = lineparam.color??"black";
	ctx.lineWidth = lineparam.thickness??1;
	ctx.stroke();
}
