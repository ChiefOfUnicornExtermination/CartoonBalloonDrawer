/* ライブラリ依存しない形でどの環境にもそのままコピーして使えるよう、サンドボックスはjQueryなどのライブラリ、フレームワークを用いていません。そのため、記述…特にイベントアタッチ系が冗長な記述になっているのはご了承ください。用いる先の環境での仕様に最適なよう書き直してください */
/**
 * なんかすごくクラシックなイベントアタッチメソッド。どんなブラウザで見てるかわからないから仕方ないね。
 * なんたってこのライブラリの目的自体がニコ生のアプリ上に乗っかってる各視聴者OSデフォルト謎ブラウザ機能で動くためのものなのでモダンブラウザならあって当たり前のものも期待してはいけないのだ
 * とかいいながらモダンブラウザに依存した記述もあるかもだけど目的はどの環境でも動くようにというよりはニコ生アプリにもっていってみんなが見れるか程度なのでこのサンドボックスが動かない環境があっても仕方ないね。世知辛い世の中だね
 */
function addEvent(elem, event, fn) {
    function listenHandler(e) {
        var ret = fn.apply(this, arguments);
        if (ret === false) {
            e.stopPropagation();
            e.preventDefault();
        }
        return(ret);
    }

    function attachHandler() {
        var ret = fn.call(elem, window.event);   
        if (ret === false) {
            window.event.returnValue = false;
            window.event.cancelBubble = true;
        }
        return(ret);
    }

    if (elem.addEventListener) {
        elem.addEventListener(event, listenHandler, false);
        return {elem: elem, handler: listenHandler, event: event};
    } else {
        elem.attachEvent("on" + event, attachHandler);
        return {elem: elem, handler: attachHandler, event: event};
    }
}

function removeEvent(token) {
    if (token.elem.removeEventListener) {
        token.elem.removeEventListener(token.event, token.handler);
    } else {
        token.elem.detachEvent("on" + token.event, token.handler);
    }
}

let _balloondrawing;
/**
 * メイン処理その他。基本全部windowのロード内イベントにいれてしまっているけど、例えばjQueryの$(function(){})内で書くようなものなので気にする必要はない。そのまま持ってって使えばよし
 */
let initializeSandbox = function(){
	// htmlにid振ってあったら定義しなくても変数としてそのままインスタンスがもらえるらしいけど（昔からこの仕様だっけ…？）それぞれの環境にもってって使ってもらうのが目的なので全部定義しとく
	let canvas = document.getElementById("sandboxcanvas");
	let predrawingcanvas = document.getElementById("predrawingcanvas");
	let canvasframe = document.getElementById("canvasframe");
	let linecanvas = document.getElementById("linesamplecanvas");
	let canvasarea = document.getElementById("canvasarea");
	let 
	  select_balloonkind = document.getElementById("balloonkind"),
	  textbox_balloonpositionx = document.getElementById("balloonpositionx"),
	  textbox_balloonpositiony = document.getElementById("balloonpositiony"),
	  textbox_balloonwidth = document.getElementById("balloonwidth"), 
	  textbox_balloonheight = document.getElementById("balloonheight"),
	  checkbox_havingtail = document.getElementById("havingtail"),
	  area_tail = document.getElementById("tailarea");
	  select_tailkind = document.getElementById("tailkind"),
	  textbox_tailwidth = document.getElementById("tailwidth"),
	  textbox_taillength = document.getElementById("taillength"),
	  textbox_tailangle = document.getElementById("tailangle"),
	  textbox_taildirection = document.getElementById("taildirection"),
	  select_linekind = document.getElementById("linekind"),
	  textbox_linecolor = document.getElementById("linecolor"),
	  textbox_lineheight = document.getElementById("lineheight"),
	  textbox_lineopacity = document.getElementById("lineopacity"),
	  textbox_linethickness = document.getElementById("linethickness"),
	  select_sizeunit = document.getElementById("sizeunit"),
	  textbox_linedensity = document.getElementById("linedensity"),
	  textbox_swellity = document.getElementById("swellity"),
	  textbox_swellAspect = document.getElementById("swellAspect"),
	  textbox_balloonbgcolor = document.getElementById("balloonbgcolor"),
	  textbox_balloonopacity = document.getElementById("balloonopacity"),
	  textbox_sandboxwidth = document.getElementById("sandboxwidth"),
	  textbox_sandboxheight = document.getElementById("sandboxheight"),
	  textbox_balloonthickness_h = document.getElementById("balloonthickness_h"),
	  textbox_balloonthickness_hd = document.getElementById("balloonthickness_hd"),
	  textbox_balloonthickness_v = document.getElementById("balloonthickness_v"),
	  textbox_balloonthickness_vd = document.getElementById("balloonthickness_vd"),
	  checkbox_freehand = document.getElementById("freehandcheck"),
	  checkbox_grid = document.getElementById("checkbox_grid"),
	  checkbox_ruler = document.getElementById("checkbox_ruler"),
	  checkbox_bgpattern = document.getElementById("bgpattern"),
	  area_tool = document.getElementById("toolarea"),
	  area_grid = document.getElementsByClassName("grid")[0],
	  area_bgpattern = document.getElementsByClassName("transparentbg")[0],
	  area_extra = document.getElementById("extraitemsarea"),
	  area_prompt = document.getElementById("promptarea"),
	  area_download = document.getElementById("downloadarea"),
	  button_addprompt = document.getElementById("addprompt"),
	  file_image = document.getElementById("imagefile"),
	  image_bg = document.getElementById("bgimage"),
	  area_bgimage = document.getElementById("bgimagearea")
	  download = document.getElementById("download");
	let ctx = canvas.getContext("2d");
    let draftctx = predrawingcanvas.getContext("2d");
    let linectx = linecanvas.getContext("2d");
	
    let preventwindowselection;
	//スライダーのコンストラクタ的なやつ。それほど重要な箇所でもなしシンプルに値が欲しいだけなので、そのまま直書きで実装してしまう。単に見た目をスライダーっぽくして動くようにしてvalueの値でとれるようにだけする。あとminとかmaxとか設定されてたら動作に含める
	let slider = function(elem){
		if (typeof elem!=="object") return;
		let sliderelem = document.createElement("span");
		sliderelem.style.cssText = "height: 30; position: relative; display: inline-block; marginTop: 5";
		sliderelem.value = sliderelem.value ? sliderelem.value.value : 0;
		for (let scaleindex = elem.attributes.min ? elem.attributes.min.value : 0; scaleindex * (elem.attributes.scale ? elem.attributes.scale.value : 10) < (elem.attributes.max ? elem.attributes.max.value : 100); scaleindex ++){
			let scaleline = document.createElement("span");
			scaleline.style.cssText = "border-left: 1px solid #DDD; display: inline-block; top: 5; height: 15; position: absolute";
		    scaleline.style["left"] = (elem.attributes.width ? elem.attributes.width.value : 200) * (elem.attributes.scale ? elem.attributes.scale.value : 10) / ((elem.attributes.max ? elem.attributes.max.value : 100) - (elem.attributes.min ? elem.attributes.min.value : 0)) * scaleindex;
			sliderelem.appendChild(scaleline);
		}
		let sliderbar = document.createElement("span");
		sliderbar.style.cssText = "border: 1px solid #DDD; background-color: #EEE; display: inline-block; visibility: visible !important; height: 5; margin-top: 10";
		sliderbar.innerText = " ";
		sliderbar.style["width"] = elem.attributes.width ? elem.attributes.width.value : 200;
		sliderelem.appendChild(sliderbar);
		
		let sliderhead = document.createElement("span");
		sliderhead.style.cssText = "border: 1px solid #DDD; background-color: #EEE; display: inline-block; width: 10; height: 25; position: absolute; top: 0";
		sliderhead.style["left"] =(elem.attributes.width ? elem.attributes.width.value : 200) / ((elem.attributes.max ? elem.attributes.max.value : 100) - (elem.attributes.min ? elem.attributes.min.value : 0)) * (elem.attributes.value ? elem.attributes.value.value : 0);
		let label = document.createElement("span");
		if (elem.attributes.showlabel) {
			label.style["position"] = "absolute";
			label.style["top"] = elem.attributes.showlabel.value == "bottom" ? 20 : 0;
			label.style["left"] = elem.attributes.showlabel.value == "bottom" ? (elem.attributes.width ? elem.attributes.width.value / 2 -30 : 70) : (elem.attributes.width ? parseInt(elem.attributes.width.value) + 20 : 220);
			label.innerText = elem.value;
			sliderelem.appendChild(label);
		}
		
		let slidertweaking;
		addEvent(sliderhead, "mousedown", function(ev){
			let slidestartposition = ev.pageX;
			let originalvalue = sliderhead.offsetLeft;
			if (!slidertweaking) slidertweaking = addEvent(window, "mousemove", function(ev) {
				// 「マウスがもう押されてない」を短く書いたやつ。ドラッグを離したときはmouseupイベントが正解でUX的にもそっちを使うべきだけど、他のウィンドウに処理が移ったりポップアップで遮られたりしたときにドラッグっぱなしにならないようにこっちも入れておいたほうがいい。本当はひとつのメソッドにしといて呼ぶだけにすべき
				if (("buttons" in (ev || window.event)) ? ((ev || window.event).buttons) != 1 : ((ev || window.event).which || (ev || window.event).button) != 1) {
					removeEvent(slidertweaking);
					slidertweaking = null;
					removeEvent(preventwindowselection);
					preventwindowselection = null;
					return;
				}
				if (elem.attributes.showlabel) {
					label.innerText = parseInt(elem.value * 10)/10;
				}
				let currentposition = (originalvalue + ev.pageX - slidestartposition) < 0 ? 0 : (originalvalue + ev.pageX - slidestartposition > sliderbar.offsetWidth ? sliderbar.offsetWidth : originalvalue + ev.pageX - slidestartposition);
				elem.value = (currentposition / sliderbar.offsetWidth) * ((elem.attributes.max ? elem.attributes.max.value : 100) - (elem.attributes.min ? elem.attributes.min.value : 0));
				elem.dispatchEvent(new Event('change'));
				sliderhead.style["left"] = currentposition;
				ev.preventDefault();
			}), preventwindowselection = addEvent(window, "selectstart", function(ev){ev.preventDefault()});
		});
		// マウスムーブイベントの中の処理と重複してる内容。めんどくさいので統一しない。片方に何か処理入れたらもう片方のも忘れないようにしよう
		addEvent(window, "mouseup", function(){if (slidertweaking) removeEvent(slidertweaking), slidertweaking = null, removeEvent(preventwindowselection), preventwindowselection = null;if (elem.attributes.showlabel) {label.innerText = parseInt(elem.value * 10)/10;}})
		sliderelem.appendChild(sliderhead);
	
	    elem.style["display"] = "none";
	    elem.after(sliderelem);
	}
	for (let sliderindex in document.getElementsByClassName("slider")){
		slider(document.getElementsByClassName("slider")[sliderindex]);
	}
	
	// スライダーのやつと同じく。カラーピッカー。さらに適当で色域とか関係なく等間隔に雑多な色並べて選べるだけ。サンドボックスなんてこの程度でいいのだ。お前らももっと自由に生きろ
	let colorpicker = function(elem){
		if (typeof elem!=="object") return;
		
		let picker = document.createElement("div");
		picker.style.cssText = "display: none; position: absolute; background-color: white; border: 1px solid lightgrey; padding: 12px; width: 282; height: 300; z-index: 40";
		let toparea = document.createElement("div");
		toparea.style["textAlign"] = "right";
		picker.appendChild(toparea);
		
		let valuetextbox = document.createElement ("input");
		valuetextbox.type = "textbox";
		valuetextbox.style["width"] = "7em";
		valuetextbox.width = 40;

		let samplersquare = document.createElement ("span");
		samplersquare.style.cssText = "display: inline-block; width: 24px; height: 24px; border: 1px solid gray; position: absolute";
		samplersquare.style["backgroundColor"] = elem.value ?? "#000000";
		
		let pickersamplersquare = document.createElement ("span");
		pickersamplersquare.style.cssText = "display: inline-block; width: 24px; height: 24px; border: 1px solid gray; position: absolute";
		pickersamplersquare.style["backgroundColor"] = elem.value ?? "#000000";
		
		
		for (let colorpickerindex = 0; colorpickerindex < 80; colorpickerindex += 1) {
			// 色温度とコントラストからいい感じのカラーチャート計算して作ったりとかも考えたけどこのレベルのサンドボックスにはやりすぎなので超適当に色をピックアップするだけにする
			let square = document.createElement ("span");
			square.style.cssText = "display: inline-block; margin: 2px; width: 24px; height: 24px;";
			square.style["backgroundColor"] = "#" + parseInt((colorpickerindex%31)/31*255).toString(16).padStart(2, "0") + parseInt(((86-colorpickerindex)%11)/11*255).toString(16).padStart(2, "0") + parseInt((((colorpickerindex+3)*2)%11)/11*255).toString(16).padStart(2, "0");
			square.value ="#" + parseInt((colorpickerindex%31)/31*255).toString(16).padStart(2, "0") + parseInt(((86-colorpickerindex)%11)/11*255).toString(16).padStart(2, "0") + parseInt((((colorpickerindex+3)*2)%11)/11*255).toString(16).padStart(2, "0");
			addEvent(square, "click", function(){ valuetextbox.value = this.value; pickersamplersquare.style["backgroundColor"] = this.value });
			picker.appendChild(square);
		}
		for (let colorpickerindex = 255; colorpickerindex > 0; colorpickerindex -= 26) {
			// 目的が漫画のフキダシってことを忘れそうになってたので白黒のやつを一列分だけ作る
			let square = document.createElement ("span");
			square.style.cssText = "display: inline-block; margin: 2px; width: 24px; height: 24px;";
			square.style["backgroundColor"] = "#" + parseInt(colorpickerindex).toString(16).padStart(2, "0")+ parseInt(colorpickerindex).toString(16).padStart(2, "0")+ parseInt(colorpickerindex).toString(16).padStart(2, "0");
			square.value  = "#" + parseInt(colorpickerindex).toString(16).padStart(2, "0")+ parseInt(colorpickerindex).toString(16).padStart(2, "0")+ parseInt(colorpickerindex).toString(16).padStart(2, "0");
			addEvent(square, "click", function(){ valuetextbox.value = this.value; pickersamplersquare.style["backgroundColor"] = this.value });
			picker.appendChild(square);
		}
		picker.appendChild(valuetextbox);
		picker.appendChild(pickersamplersquare);
		
		let colorsubmitbutton = document.createElement ("input");
		colorsubmitbutton.style.cssText = "position: absolute; right: 2em";
		colorsubmitbutton.value = "決定";
		colorsubmitbutton.type = "button";
		elem.pickedupcolor = function(){}
	    addEvent(colorsubmitbutton, "click", function(){ elem.value = valuetextbox.value; elem.dispatchEvent(new Event('change')); samplersquare.style["backgroundColor"] = valuetextbox.value; picker.style["display"] = "none"; elem.pickedupcolor()})
		picker.appendChild(colorsubmitbutton);
		
		let cancelbutton = document.createElement ("input");
		cancelbutton.value = "×";
		cancelbutton.type = "button";
	    addEvent(cancelbutton, "click", function(){ picker.style["display"] = "none"})
		toparea.appendChild(cancelbutton);
		
		elem.after(picker);
		
		addEvent(samplersquare, "click", function(){ valuetextbox.value = elem.value; pickersamplersquare.style["backgroundColor"] = elem.value; picker.style["display"] = "inline-block" });
		elem.after(samplersquare);
		elem.selected = new Event("select");
	}
	for (let colorpickindex in document.getElementsByClassName("colorpicker")){
		colorpicker(document.getElementsByClassName("colorpicker")[colorpickindex]);
	}
	
	let rectdrawing; // ガイド四角形描画中のイベントトークン
	let guidesquare = document.createElement("div");
	guidesquare.style.cssText = "position: absolute; border: 4px dotted #CCC; display: none; z-index: 5;";
	canvasarea.style["position"] = "relative";
	canvasarea.appendChild(guidesquare);
	let isCtrlPressed = false;
	addEvent(window, "keydown", function(e){isCtrlPressed=e.ctrlKey});
	addEvent(window, "keyup", function(e){isCtrlPressed=e.ctrlKey});
	addEvent(canvas, "mousedown", function(ev){
		if (checkbox_freehand.checked) {
			// 【未実装】フリーハンド描画
			return;
		} else {
			let balloondrawingstartposition = { x: ev.pageX, y: ev.pageY };
			if (!rectdrawing) rectdrawing = addEvent(window, "mousemove", function(ev) {
				// 「マウスがもう押されてない」を短く書いたやつ
				if (("buttons" in (ev || window.event)) ? ((ev || window.event).buttons) != 1 : ((ev || window.event).which || (ev || window.event).button) != 1) {
					removeEvent(rectdrawing);
					rectdrawing = null;
					removeEvent(preventwindowselection);
					preventwindowselection = null;
					guidesquare.style["display"] = "none";
					draw();
					return;
				}
				let left, right, top, bottom;
				if (isCtrlPressed) {
					left = (ev.pageX < balloondrawingstartposition.x ? ev.pageX : 2*balloondrawingstartposition.x - ev.pageX) - canvasarea.offsetLeft;// - parseInt(window.getComputedStyle(canvasarea, null).getPropertyValue('padding-left'));
					right = (ev.pageX > balloondrawingstartposition.x ? ev.pageX : 2*balloondrawingstartposition.x - ev.pageX) - canvasarea.offsetLeft;// - parseInt(window.getComputedStyle(canvasarea, null).getPropertyValue('padding-left'));
					top = (ev.pageY < balloondrawingstartposition.y ? ev.pageY : 2*balloondrawingstartposition.y - ev.pageY) - canvasarea.offsetTop;// - parseInt(window.getComputedStyle(canvasarea, null).getPropertyValue('padding-top'));
					bottom = (ev.pageY > balloondrawingstartposition.y ? ev.pageY : 2*balloondrawingstartposition.y - ev.pageY) - canvasarea.offsetTop;// - parseInt(window.getComputedStyle(canvasarea, null).getPropertyValue('padding-top'));
					left = left > canvasframe.offsetLeft ? left : canvasframe.offsetLeft;
					right = right < (canvasframe.offsetLeft + canvasframe.offsetWidth -8) ? right : (canvasframe.offsetLeft + canvasframe.offsetWidth -8); // なんか計算間違ってるっぽいけどいいんだよ別に。細けぇことは気にすんな。もっと世界平和のこととか考えろ
					top = top > canvasframe.offsetTop ? top : canvasframe.offsetTop;
					bottom = bottom < (canvasframe.offsetTop + canvasframe.offsetHeight -8) ? bottom : (canvasframe.offsetTop + canvasframe.offsetHeight -8);
				} else {
					left = (ev.pageX < balloondrawingstartposition.x ? ev.pageX : balloondrawingstartposition.x) - canvasarea.offsetLeft;// - parseInt(window.getComputedStyle(canvasarea, null).getPropertyValue('padding-left'));
					right = (ev.pageX > balloondrawingstartposition.x ? ev.pageX : balloondrawingstartposition.x) - canvasarea.offsetLeft;// - parseInt(window.getComputedStyle(canvasarea, null).getPropertyValue('padding-left'));
					top = (ev.pageY < balloondrawingstartposition.y ? ev.pageY : balloondrawingstartposition.y) - canvasarea.offsetTop;// - parseInt(window.getComputedStyle(canvasarea, null).getPropertyValue('padding-top'));
					bottom = (ev.pageY > balloondrawingstartposition.y ? ev.pageY : balloondrawingstartposition.y) - canvasarea.offsetTop;// - parseInt(window.getComputedStyle(canvasarea, null).getPropertyValue('padding-top'));
					left = left > canvasframe.offsetLeft ? left : canvasframe.offsetLeft;
					right = right < (canvasframe.offsetLeft + canvasframe.offsetWidth -8) ? right : (canvasframe.offsetLeft + canvasframe.offsetWidth -8);
					top = top > canvasframe.offsetTop ? top : canvasframe.offsetTop;
					bottom = bottom < (canvasframe.offsetTop + canvasframe.offsetHeight -8) ? bottom : (canvasframe.offsetTop + canvasframe.offsetHeight -8);
				}
				if (left==right&&top==bottom) return;// たまに発生するようになった現象。ドラッグ中に同位置でドラッグ終了を検知した扱いにされる。解決するまで除外
				
				guidesquare.style["display"] = "inline-block";
				guidesquare.style["left"] = left;
				guidesquare.style["width"] = right - left;
				guidesquare.style["top"] = top;
				guidesquare.style["height"] = bottom - top;
				textbox_balloonpositionx.value = parseInt(left/2 + right/2) - parseInt(window.getComputedStyle(canvasarea, null).getPropertyValue('padding-left'));
				textbox_balloonpositiony.value = parseInt(top/2 + bottom/2) - parseInt(window.getComputedStyle(canvasarea, null).getPropertyValue('padding-top'));
				textbox_balloonwidth.value = right - left;
				textbox_balloonheight.value = bottom - top;
				ev.preventDefault();
			}), preventwindowselection = addEvent(window, "selectstart", function(ev){ev.preventDefault()});
		}
	});
	// マウスムーブイベントの中の処理と重複してる内容。めんどくさいので統一しない。片方に何か処理入れたらもう片方のも忘れないようにしよう
	addEvent(window, "mouseup", function(){if (rectdrawing) { removeEvent(rectdrawing), rectdrawing = null, removeEvent(preventwindowselection), preventwindowselection = null, guidesquare.style["display"] = "none"; if (textbox_balloonwidth.value>4&&textbox_balloonheight.value>4) draw()}});// TBD:ナゾ現象対応。ドラッグ後に再度Donw->Upが一瞬行われた判定になる。極小サイズはノーカン扱いにして対応
	
	// こちらも同じく、角度ピッカー。実際に使用するラジアン値と表示されてるレーダー形状角度表示は違うんだけど、画面上に描画される座標系と計算に使われる座標系は方向が違うのであえてわかりやすく「この見た目みたいな角度を描画する」ようにする
	let anglepicker = function(elem){
		if (typeof elem!=="object") return;
		let board = document.createElement("div");
		board.style.cssText = "border-radius: 24px; width: 48; height: 48; display:inline-block; top: 0; margin-left: 8; background-color: lightgrey;vertical-align: middle; position: relative";
		let directionline = document.createElement("div");
		directionline.style.cssText = "border-bottom: 3px solid black; position: absolute; width: 24; height: 1";
		board.append(directionline);
		
		let changeangle = function(){
			directionline.style["left"] = 13-16*Math.cos(parseFloat(elem.value)-Math.PI);
			directionline.style["top"] = 23-16*Math.sin(parseFloat(elem.value)-Math.PI);
			directionline.style["transform"] = "rotate(" + (parseFloat(elem.value)-Math.PI) + "rad)";
		}
		
		let angletweaking;
		addEvent(board, "mousedown", function(ev){
			if (!angletweaking) angletweaking = addEvent(window, "mousemove", function(ev) {
				if (("buttons" in (ev || window.event)) ? ((ev || window.event).buttons) != 1 : ((ev || window.event).which || (ev || window.event).button) != 1) {
					removeEvent(angletweaking);
					angletweaking = null;
					removeEvent(preventwindowselection);
					preventwindowselection = null;
					return;
				}
				elem.value = Math.atan2(ev.pageY-board.offsetTop+board.offsetWidth/2, ev.pageX-board.offsetLeft+board.offsetHeight/2);
				elem.dispatchEvent(new Event('change'));
				changeangle();
				ev.preventDefault();
			}), preventwindowselection = addEvent(window, "selectstart", function(ev){ev.preventDefault()});
		});
		changeangle();
		addEvent(window, "mouseup", function(){if (angletweaking) removeEvent(angletweaking), angletweaking = null, removeEvent(preventwindowselection), preventwindowselection = null;changeangle()});
		elem.after(board);
	}
	for (let anglepickindex in document.getElementsByClassName("anglepicker")){
		anglepicker(document.getElementsByClassName("anglepicker")[anglepickindex]);
	}

    let rulerTop = document.createElement("div");
    canvasarea.appendChild(rulerTop);
    let rulerLeft = document.createElement("div");
	canvasarea.appendChild(rulerLeft);
	// ルーラー描画（および画面サイズ変更したときのその描き直し）。見た目以上に子オブジェクトだらけで本当は再利用したり長いの作っといて表示位置調整するだけとかのほうがいいんだろうけど、それもめんどいのでまるっと作り直し。すごい勢いで画面サイズ変えまくると迷子になったルーラー子要素でメモリいっぱいになったりするかもしれんけど…せんでしょ
    let drawRuler = function(){
		for (let ci in rulerTop.childNodes) {
			// 一応掃除するフリだけはする。実際メモリ上見た感じ破棄はされてないっぽい。「ちょっとぉ～男子ぃ～マジメに掃除しなさいよぉ」っていわれちゃうやつ
			if (typeof(rulerTop.childNodes[ci]) == "object") {
				rulerTop.removeChild(rulerTop.childNodes[ci]);
				if (rulerTop.childNodes[ci]) rulerTop.childNodes[ci].remove();
			}
		}
		rulerTop.childNodes = null;
		rulerTop.childNodes = new Array();
		for (let ci in rulerLeft.childNodes) {
			if (typeof(rulerLeft.childNodes[ci]) == "object") {
				rulerLeft.removeChild(rulerLeft.childNodes[ci]);
				if (rulerLeft.childNodes[ci]) rulerLeft.childNodes[ci].remove();
			}
		}
	    rulerLeft.childNodes = null;
	    rulerLeft.childNodes = new Array();
		rulerTop.style.cssText = "background-color: white; position: absolute; top: 0; left: 0; z-index: 7; overflow:hidden";
		rulerTop.style["width"] = canvasarea.offsetWidth-2;
		rulerTop.style["height"] = canvasarea.offsetTop - canvasframe.offsetTop +5;
		
		let unit_hlabel = document.createElement("div");
		unit_hlabel.style.cssText = "position: absolute; font-size: 12px; color: grey";
		unit_hlabel.style["top"] = canvasarea.offsetTop - canvasframe.offsetTop -14;
		let unit_hl = document.createElement("div");
		unit_hl.style.cssText = "height: 12; border-left: 1px solid grey; position: absolute";
		unit_hl.style["top"] = canvasarea.offsetTop - canvasframe.offsetTop -6;
		let unit_hm = document.createElement("div");
		unit_hm.style.cssText = "height: 8; border-left: 1px solid grey; position: absolute";
		unit_hm.style["top"] = canvasarea.offsetTop - canvasframe.offsetTop -2;
		let unit_hs = document.createElement("div");
		unit_hs.style.cssText = "height: 4; border-left: 1px solid grey; position: absolute";
		unit_hs.style["top"] = canvasarea.offsetTop - canvasframe.offsetTop +1;
		for (let i= canvasframe.offsetLeft; i < canvasframe.offsetWidth + 25; i+=5) {
			if ((i)%50 == canvasframe.offsetLeft%50) {
				unit_hl.style["left"] = i;
				rulerTop.appendChild(unit_hl.cloneNode());
				let labelclone = unit_hlabel.cloneNode();
				labelclone.style["left"] = i + 4;
				labelclone.innerText = (i - canvasframe.offsetLeft);
				rulerTop.appendChild(labelclone);
			} else if ((i)%25 == canvasframe.offsetLeft%25) {
				unit_hm.style["left"] = i;
				rulerTop.appendChild(unit_hm.cloneNode());
			} else {
				unit_hs.style["left"] = i;
				rulerTop.appendChild(unit_hs.cloneNode());
			}
		}
		rulerLeft.style.cssText = "background-color: white; position: absolute; left: 0; z-index: 0; overflow:hidden";
		rulerLeft.style["width"] = canvasframe.offsetLeft - canvasarea.offsetLeft +8;
		rulerLeft.style["height"] = canvasframe.offsetHeight;
		rulerLeft.style["top"] = canvasframe.offsetTop;
		let unit_vlabel = document.createElement("div");
		unit_vlabel.style.cssText = "position: absolute; font-size: 12px; color: grey";
		unit_vlabel.style["left"] = canvasframe.offsetLeft -20;
		let unit_vl = document.createElement("div");
		unit_vl.style.cssText = "width: 12; border-top: 1px solid grey; position: absolute";
		unit_vl.style["left"] = canvasframe.offsetLeft -12;
		let unit_vm = document.createElement("div");
		unit_vm.style.cssText = "width: 8; border-top: 1px solid grey; position: absolute";
		unit_vm.style["left"] = canvasframe.offsetLeft -8;
		let unit_vs = document.createElement("div");
		unit_vs.style.cssText = "width: 4; border-top: 1px solid lightgrey; position: absolute";
		unit_vs.style["left"] = canvasframe.offsetLeft -4;
		for (let i= 0; i < canvasframe.offsetHeight; i+=5) {
			if (i%50 == 0) {
				unit_vl.style["top"] = i;
				rulerLeft.appendChild(unit_vl.cloneNode());
				let labelclone = unit_vlabel.cloneNode();
				labelclone.style["top"] = i + 4;
				labelclone.innerText = i;
				rulerLeft.appendChild(labelclone);
			} else if (i%25 == 0) {
				unit_vm.style["top"] = i;
				rulerLeft.appendChild(unit_vm.cloneNode());
			} else {
				unit_vs.style["top"] = i;
				rulerLeft.appendChild(unit_vs.cloneNode());
			}
		}
	}
	rulerTop.style["visibility"] = checkbox_ruler.checked ? "visible" : "hidden";
	rulerLeft.style["visibility"] = checkbox_ruler.checked ? "visible" : "hidden";

	addEvent(textbox_sandboxwidth, "blur", function(){ if (parseInt(this.value)) resizecanvas()});
	addEvent(textbox_sandboxheight, "blur", function(){ if (parseInt(this.value)) resizecanvas()});
	area_bgpattern.style["visibility"] = checkbox_bgpattern.checked ? "visible" : "hidden";
	addEvent(checkbox_bgpattern, "click", function(ev){ area_bgpattern.style["visibility"] = ev.target.checked ? "visible" : "hidden" });
	// ちなみにグリッドは『嘘』です。グリッドっぽいものを表示してるだけで何も測ってません。グリッド吸着の動作は実装する可能性もあるけど、その場合は「何の意味もない不明単位の点に吸着」することになります
	addEvent(checkbox_grid, "click", function(ev){ area_grid.style["visibility"] = ev.target.checked ? "visible" : "hidden" });
	addEvent(checkbox_ruler, "click", function(ev){ rulerTop.style["visibility"] = ev.target.checked ? "visible" : "hidden"; rulerLeft.style["visibility"] = ev.target.checked ? "visible" : "hidden";  });
	
	area_grid.style["visibility"] = checkbox_grid.checked ? "visible" : "hidden";
	
	for (let balloonkey in _balloondrawing.balloons) {
		if (typeof _balloondrawing.balloons[balloonkey] === "object") {
			let balloonselectoption = document.createElement("option");
			if (_balloondrawing.balloons[balloonkey].defaultvalue) balloonselectoption.selected = "selected";
			balloonselectoption.value = balloonkey;
			balloonselectoption.innerText = _balloondrawing.balloons[balloonkey].name;
			select_balloonkind.appendChild(balloonselectoption);
		}
	}
	
	for (let linekey in _balloondrawing.lines) {
		if (typeof _balloondrawing.lines[linekey] === "object") {
			let lineselectoption = document.createElement("option");
			if (_balloondrawing.lines[linekey].defaultvalue) lineselectoption.selected = "selected";
			lineselectoption.value = linekey;
			lineselectoption.innerText = _balloondrawing.lines[linekey].name;
			select_linekind.appendChild(lineselectoption);
		}
	}
	
	for (let tailkey in _balloondrawing.tails) {
		if (typeof _balloondrawing.tails[tailkey] === "object") {
			let tailselectoption = document.createElement("option");
			if (_balloondrawing.tails[tailkey].defaultvalue) tailselectoption.selected = "selected";
			tailselectoption.value = tailkey;
			tailselectoption.innerText = _balloondrawing.tails[tailkey].name;
			select_tailkind.appendChild(tailselectoption);
		}
	}
	
	let drawlinesample = function(){
		let level = linecanvas.height*3/4;
		linectx.clearRect(0, 0, linecanvas.width, linecanvas.height);
		linectx.strokeStyle = "red";
		linectx.beginPath();
		linectx.lineWidth = 1;
		linectx.moveTo(0, level);
		linectx.lineTo(linecanvas.width, level);
		linectx.stroke();
		linectx.closePath();

		let linekind = select_linekind[select_linekind.selectedIndex].value;
		let line = _balloondrawing.lines[linekind];
		linectx.strokeStyle = textbox_linecolor.value;
		linectx.lineWidth = textbox_linethickness.value;
		linectx.globalAlpha = textbox_lineopacity;
		linectx.beginPath();
		linectx.moveTo(0, level);
		let continuetime = 25 / textbox_linedensity.value; // サンプルを何回繰り返すか
		let d = new _balloondrawing.DrawingContext(linectx, {});
		for (let i=0; i<=continuetime; i++) {
			d.startpoint = {x: i*linecanvas.width/continuetime, y: level};
			d.endpoint = {x: (i+1)*linecanvas.width/continuetime, y: level};
			d.current = d.startpoint;
			d.size = textbox_lineheight.value;
			for (let l=0; l< Object.keys(line.progresses).length; l++) {
				let linep = line.progresses[Object.keys(line.progresses).sort()[l]];
				d.next = {x: l/2*linecanvas.width/continuetime + i*linecanvas.width/continuetime, y: level}; // 「線が引かれる次の点」。直線の場合はそのままキーで渡された割合の点
				d.caret = new _balloondrawing.Vector2DSimple({m: _balloondrawing.Eucrid(d.next, d.current), r: 0});
				linep(d);
		linectx.stroke();
				d.current = d.next;
			}
		}
		linectx.stroke();
	}
	drawlinesample();
	addEvent(select_linekind, "change", drawlinesample);
	addEvent(textbox_linedensity, "change", drawlinesample);
	addEvent(textbox_lineheight, "change", drawlinesample);
	addEvent(textbox_linethickness, "change", drawlinesample);
	addEvent(select_sizeunit, "change", drawlinesample);
	addEvent(textbox_linecolor, "change", drawlinesample);
	addEvent(textbox_lineopacity, "change", drawlinesample);
	area_tail.style["display"] = checkbox_havingtail.checked?"inline" : "none";
	addEvent(checkbox_havingtail, "click", function(){ area_tail.style["display"] = this.checked?"inline" : "none"; });
	
	let resizecanvas = function(){
		canvas.width = parseInt(textbox_sandboxwidth.value);
		canvasframe.style["width"] = parseInt(textbox_sandboxwidth.value);
		predrawingcanvas.width = parseInt(textbox_sandboxwidth.value);
		
		canvas.height = parseInt(textbox_sandboxheight.value);
		canvasframe.style["height"] = parseInt(textbox_sandboxheight.value);
		predrawingcanvas.height = parseInt(textbox_sandboxheight.value);
		
		area_extra.style["top"] = canvasarea.offsetTop + canvasarea.offsetHeight + 20;
		area_extra.style["left"] = (canvasarea.offsetWidth < area_tool.offsetLeft) ? canvasarea.offsetLeft : (toolarea.offsetLeft + toolarea.offsetWidth + 16);

		drawRuler();
	}
	
	// セリフは完全に当初の計画になかった「オマケ」です。実際の利用箇所でフキダシがどうみえるかのアタリつけくらいの位置づけで…
	// 設定ボックスの位置取りが絶対座標で酷い（でかい画像で横ツールボックスが降りてきたら位置がグシャる）のもそのくらいのレベルのもんだから
	area_extra.style.cssText = "position: absolute;";
	addEvent(addprompt, "click", ()=>{
		let prompt = document.createElement("div");
		prompt.classList.add("prompt");
		prompt.style.cssText = "position:absolute; left: 400; top: 20; writing-mode:vertical-rl;font-size:44;z-index:5; user-select: none; -o-user-select: none; -moz-user-select: none; -khtml-user-select: none; -webkit-user-select: none;";
		prompt.innerText = "";
		canvasarea.append(prompt);
		
		let prompttweaking;
		addEvent(prompt, "mousedown", function(ev){
			if (!prompttweaking) prompttweaking = addEvent(window, "mousemove", function(ev) {
				if (("buttons" in (ev || window.event)) ? ((ev || window.event).buttons) != 1 : ((ev || window.event).which || (ev || window.event).button) != 1) {
					removeEvent(prompttweaking);
					prompttweaking = null;
					removeEvent(preventwindowselection);
					preventwindowselection = null;
					return;
				}
				prompt.style["left"] = (ev.clientX - 24) < canvasframe.offsetLeft ? canvasframe.offsetLeft : (canvasframe.offsetWidth - 14) < (ev.clientX - 24) ? (canvasframe.offsetWidth - 14) : (ev.clientX - 24);
				prompt.style["top"] = (ev.clientY - 32) < canvasframe.offsetTop ? canvasframe.offsetTop : (canvasframe.offsetHeight) < (ev.clientY - 32) ? (canvasframe.offsetHeight) : (ev.clientY - 32);
				ev.preventDefault();
			}), preventwindowselection = addEvent(window, "selectstart", function(ev){ev.preventDefault()});
		});
		addEvent(window, "mouseup", function(){if (prompttweaking) removeEvent(prompttweaking), prompttweaking = null, removeEvent(preventwindowselection), preventwindowselection = null});
		
		let newitem = document.createElement("div");
		newitem.style["position"] = "relative";
		let promptinput = document.createElement("input");
		promptinput.attributes["type"] = "text";
		newitem.append(promptinput);
		addEvent(promptinput, "change", ()=>{if (event.target.value) prompt.innerText = event.target.value });
		addEvent(promptinput, "keyup", ()=>{if (event.target.value) prompt.innerText = event.target.value });
		let configuretext = document.createElement("button");
		configuretext.style.cssText = "width: 1.5em; height: 1.5em; display:inline-block; background-color: lightgrey; border: 1px solid grey; border-radius: 3px; padding: 0; cursor: pointer";
		configuretext.innerText = "⚙";
		
		let fontconfigarea = document.createElement("div");
		fontconfigarea.style.cssText = "position: absolute; left: -10; top: -10; min-width: 8em; min-height: 3em; background-color: #EEEEEE; border: 1px solid grey; display:none; padding: 1.5em 0.5em 0.5em 0.5em;z-index: 2";
		newitem.append(fontconfigarea);
		let closebutton = document.createElement("button");
		closebutton.style.cssText = "position: absolute; width: 1em; height: 1em; display:inline-block; background-color: coral; border: 1px solid grey; border-radius: 3px; cursor: pointer; padding: 0px; right: 0.5em; top: 0.5em";
		closebutton.innerText = "×";
		fontconfigarea.append(closebutton);
		
		let fontselect = document.createElement("select");
		fontconfigarea.append(fontselect);
		fontselect.style["display"] = "none";
		
		let fontreader = document.fonts.values();
		let font = fontreader?.next();
		while(font&&!font.done) {
			let fontoption = document.createElement("option");
			fontoption.innerText = font.name;
			fontoption.innerText = font.key;
			fontselect.append(fontoption);
		}
		const availableFonts = window.queryLocalFonts();
		availableFonts.then((fonts) => {
			
			for (const fontData of fonts) {
				let fontoption = document.createElement("option");
				fontoption.innerText = fontData.fullName;
				fontoption.innerText = fontData.family;
				fontselect.append(fontoption);
			}
			if (fontselect.options.length) {
				fontselect.style["display"] = "inline-block";
			}
		});
		addEvent(fontselect, "change", ()=>{if (event.target.value) prompt.style["fontFamily"] = event.target.value});
		if (fontselect.options.length) {
			fontselect.style["display"] = "inline-block";
		}
		
		let fontsize = document.createElement("input");
		fontsize.attributes["type"] = "text";
		fontsize.value = "44";
		fontsize.style.cssText = "width: 4em;block: inline-block";
		addEvent(fontsize, "change", ()=>{if (event.target.value) prompt.style["fontSize"] = event.target.value});
		fontconfigarea.append(fontsize);
		
		let fontcolor = document.createElement("input");
		fontcolor.attributes["type"] = "text";
		fontcolor.value = "#000000";
		fontcolor.style.cssText = "width: 6em;display:inlie-block";
		addEvent(fontcolor, "change", ()=>{if (event.target.value) prompt.style["color"] = event.target.value});
		fontconfigarea.append(fontcolor);
		colorpicker(fontcolor);
		fontcolor.pickedupcolor = function(){prompt.style["color"] = fontcolor.value};
		
		let fontdirection = document.createElement("button");
		fontdirection.style.cssText = "margin-left: 2em";
		fontdirection.innerText = "↓"
		addEvent(fontdirection, "click", ()=>{ event.target.innerText = event.target.innerText=="↓"?"→":"↓" ;prompt.style["writingMode"] = event.target.innerText == "↓"?"vertical-rl":""});
		fontconfigarea.append(fontdirection);
		
		let bold = document.createElement("button");
		bold.style.cssText = "display: inline-block; margin-left: 2em;";
		bold.innerText = "b"
		addEvent(bold, "click", ()=>{ event.target.innerText = event.target.innerText==="b"?"B":"b" ;prompt.style["fontWeight"] = event.target.innerText == "B"?"bold":""; event.target.style["fontWeight"] = prompt.style["fontWeight"]});
		fontconfigarea.append(bold);
		let italic = document.createElement("button");
		italic.style.cssText = "display: inline-block;";
		italic.innerText = "i"
		addEvent(italic, "click", ()=>{ event.target.innerText = event.target.innerText=="i"?"I":"i"; prompt.style["fontStyle"] = event.target.innerText == "I"?"italic":""; event.target.style["fontStyle"] = prompt.style["fontStyle"]});
		fontconfigarea.append(italic);
		let underline = document.createElement("button");
		underline.style.cssText = "display: inline-block;";
		underline.innerText = "u"
		addEvent(underline, "click", ()=>{ event.target.innerText = event.target.innerText=="u"?"U":"u"; prompt.style["textDecorationLine"] = event.target.innerText == "U"?"underline":""; event.target.style["textDecorationLine"] = prompt.style["textDecorationLine"]});
		fontconfigarea.append(underline);
		
		addEvent(closebutton, "click", function(){fontconfigarea.style["display"] = "none"});
		newitem.append(configuretext);
		addEvent(configuretext, "click", function(){fontconfigarea.style["display"] = "block";});
		event.target.parentElement.insertBefore( newitem, event.target);
		promptinput.focus();
	});
	
	// こっちの画像アップはもうさらにさらにオマケ。動作は完全に保証できない感じ
	area_bgimage.style.cssText = "position: absolute; z-index: 2";
	image_bg.style["display"] = "none";
	addEvent(image_bg, "load", function(){
		textbox_sandboxwidth.value = this.width<600&&this.height<800?600:this.width;
		textbox_sandboxheight.value = this.height<800&&this.width<600?800:this.height;
		resizecanvas();
	});
	addEvent(file_image, "change", function(ev){
		let file = ev?.target?.files[0];
		if (!file||!file.type.startsWith("image/")) {
		  return;
		}

		image_bg.style["display"] = "block";
		image_bg.file = file;
		image_bg.src = URL.createObjectURL(file);
	});
	
	//　そこまでやるからにはダウンロードも欲しいところだけど、キャンバスにDOM要素描画するって思ったより大変…というかサポート外なのであきらめる。やるとしても当分後回し…と思ったけどできたわ。動いてたらラッキーくらいのつもりで使ってください
	let downloadasfile = function(){
		const tempareaField = document.createElement("div");
		tempareaField.style.cssText = "height:1; overflow: hidden";
		area_download.appendChild(tempareaField);
		const targetImg = document.createElement("img");
		const tempcanvas = document.createElement('canvas');
		const tempctx = tempcanvas.getContext('2d');
		tempcanvas.width = sandboxcanvas.width;
		tempcanvas.height = sandboxcanvas.height;
		tempctx.drawImage(image_bg, 0, 0);
		tempctx.drawImage(sandboxcanvas, 0, 0);
		let promptsQueue = [];
		tempareaField.appendChild(targetImg);
		tempareaField.appendChild(tempcanvas);
		let downloadAsImage = function(canv){
			canv.toBlob((blob) => {
				const url = URL.createObjectURL(blob);
				targetImg.src = url;
				tempareaField.appendChild(targetImg);
				const a = document.createElement('a');
				a.href = targetImg.src;
				a.download = targetImg.src.split('/').pop();
				tempareaField.appendChild(a);
				a.click();
				tempareaField.removeChild(a);
				tempareaField.removeChild(targetImg);	
				area_download.removeChild(tempareaField);
			});
		}
		if (document.getElementsByClassName("prompt").length) {
			for (let i in document.getElementsByClassName("prompt")){
				let prompt = document.getElementsByClassName("prompt")[i];
				if (!prompt.nodeType) continue;
				promptsQueue.push(prompt);
				let img = document.createElement("img");
				addEvent(img, "load", function (e){
					tempctx.drawImage(e.target, 0, 0);
					promptsQueue.pop(e.target);
					if (promptsQueue.length < 1) {
						downloadAsImage(tempcanvas);
					}
				});
				let foreignObjTag = "<div xmlns='http://www.w3.org/1999/xhtml' style='" + prompt.style.cssText + "'>" + prompt.innerText + "</div>";
				img.src = "data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='" + tempcanvas.width + "' height='" + tempcanvas.height + "'><foreignObject width='100%' height='100%'>" + foreignObjTag + "</foreignObject></svg>");
			}
		} else {
			downloadAsImage(tempcanvas);
		}
	}
	addEvent(download, "click", downloadasfile);
	
	
	resizecanvas();
}

addEvent(window, "load", ()=>{
	(async () => {
		import("./drawballoon.js").then (function(el){
			_balloondrawing = el;
			initializeSandbox();
		});
	})();
});