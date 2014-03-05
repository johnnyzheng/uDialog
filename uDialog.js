/**
 * ===================================
 * uDialog 弹窗组件
 * @author johnnyzheng zhixinmeng
 * @
	 * @param {Object} json 配置数组
	 * @param {Object} callback 回调函数
	 * @expample  var dialog = new uDialog( {
					 type: 1,
					 title: '选择渠道',
					 content: 'aaaaaaaaaaa',
					 detail: '',
					 btnType: 1,
					 extra: {top: 250},
					 winSize : 2
					 }, function(){});
 * ===================================
 */

//实现拖拽效果的插件
(function($){
	$.fn.drag=function(options){
		//默认配置
		var defaults = {
			handler:false,
			opacity:1
			};
	
	       // 覆盖默认配置
		var opts = $.extend(defaults, options);
	
		this.each(function(){
			//初始标记变量
			var isMove=false,
			//handler如果没有设置任何值，则默认为移动对象本身，否则为所设置的handler值
			handler=opts.handler?$(this).find(opts.handler):$(this),
			_this=$(this), //移动的对象
			dx,dy;
		
			$(document).mousemove(function(event){
				if(isMove){
				  	//获得鼠标移动后位置
					var eX=event.pageX,eY=event.pageY;
					//更新对象坐标
				 	_this.css({'left':eX-dx,'top':eY-dy});
				}
			}).mouseup(function(){
				isMove=false;
				_this.fadeTo('fast', 1);
				//console.log(isMove);
			});
		
			handler.mousedown(function(event){
				//判断最后触发事件的对象是否是handler
				if($(event.target).is(handler)){
					isMove=true;
					$(this).css('cursor','move');
					//console.log(isMove);
					_this.fadeTo('fast', opts.opacity);
			
					//鼠标相对于移动对象的坐标
					dx=event.pageX-parseInt(_this.css("left"));
					dy=event.pageY-parseInt(_this.css("top"));
			
				}
		 	});
	 	});
	};
 })(jQuery);


(function(){
	window.uDialog = function(json, callback) {
		var defaults = {
			type : 1, //对话框类型，1：通用类型，接收html内容,	2：控件，
			//			3：纯文本 -- 提示信息，绿色，	4：纯文本 -- 警告信息，橙色
			//			5：纯文本 -- 警告信息，红色		6：纯文本 -- 错误信息，红色
			title : '温馨提示',
			hideCloseIcon : false, //是否显示右上角的关闭图标
			content : '',
			detail : '',
			tips : '',
			btnType : 1, //按钮类型，1：确定，取消  2：是，否  3，确定  false，4：继续，false，5：不显示按钮，6，自定义按钮
			buttons : {
				text1 : '',
				text2 : ''
			},
			winSize : 1, //窗体大小，1：小窗体，样式为min，2：大窗体，样式为 mid
			extra : {//扩展信息，如控制对话框宽度，显示层次，位置等
				top : 200,
				left : '',
				width : '',
				zIndex : 1001,
				heatmap : '', //是否是热区图页面，兼容旧版
				noPrompt : '', //是否显示“下次不再显示”复选框，待实现
				autoMask : true,
				autoClose : true,
				draggable : false
			}
		}; 
		!json.extra && (json.extra = defaults.extra);
		var opts = $.extend(true, defaults, json);
		var self = this;
		self.dialogId = '';
	
		//遮罩层处理对象
		var mask = {
			self : '',
			isIE6 : $.browser.msie && $.browser.version < 7,
			create : function() {
				if(this.self && this.self.parent().length) {
					return;
				}
				$(window).bind('resize.overlay', this.resize);
				return (this.self = (this.self || $('<div></div>').css({
					height : '100%',
					left : 0,
					position : 'absolute',
					top : 0,
					width : '100%',
					background : '#000',
					'opacity' : 0.3,
					'z-index' : 777
				})).appendTo('body').css({
					width : this.width(),
					height : this.height()
				}));
			},
			destroy : function() {
				if(this.self && !this.self.parent().length) {
					return;
				}
				$([document, window]).unbind('resize.overlay');
				this.self.animate({
					opacity : 'hide'
				}, function() {
					$(this).remove().show();
				});
			},
			height : function() {
				var scrollHeight, offsetHeight;
				if(this.isIE6) {
					scrollHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
					offsetHeight = Math.max(document.documentElement.offsetHeight, document.body.offsetHeight);
					if(scrollHeight < offsetHeight) {
						return $(window).height() + 'px';
					} else {
						return scrollHeight + 'px';
					}
				} else {
					return $(document).height() + 'px';
				}
			},
			width : function() {
				var scrollWidth, offsetWidth;
				if(this.isIE6) {
					scrollWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
					offsetWidth = Math.max(document.documentElement.offsetWidth, document.body.offsetWidth);
					if(scrollWidth < offsetWidth) {
						return $(window).width() + 'px';
					} else {
						return scrollWidth + 'px';
					}
				} else {
					return $(document).width() + 'px';
				}
			}
		};
	
		//创建窗体方法
		var create = function() {
	
			var extra = opts.extra;
			var zIndex = extra['zIndex'];
	
			while($('#fwin_dialog_fs_100' + zIndex)[0]) {
				zIndex++;
			}
			var message_id = 'fs_100' + zIndex;
			var dialogId = 'fwin_dialog_' + message_id;
			var contentId = dialogId + '_content';
			var closeIconId = dialogId + '_closeIcon';
			var tipsId = dialogId + '_tips';
			var msgId = dialogId + '_msg';
			var btnId1 = dialogId + '_btn1', btnId2 = dialogId + '_btn2', btnContainer1 = dialogId + '_btnCtn1';
			self.dialogId = dialogId;
			self.btnId1 = btnId1;
			self.btnContainer1 = btnContainer1;
	
			var dialogPosition = ($.browser.msie && $.browser.version < 7) ? 'absolute' : 'fixed';
			extra['heatmap'] && ( dialogPosition = 'absolute');
			//热区图
			var btnText1, btnText2, tips = opts.tips, btnType = opts.btnType;
			var typeList = {
				1 : ['确定', '取消'],
				2 : ['是', '否'],
				3 : ['确定', ''],
				4 : ['继续', ''],
				5 : ['', '']
			};
			if(btnType != 6) {
				btnType = typeList[btnType] ? btnType : 1;
				//默认取第一个
				btnText1 = typeList[btnType][0];
				btnText2 = typeList[btnType][1];
			} else {
				btnText1 = opts.buttons.text1;
				btnText2 = opts.buttons.text2;
			}
	
			//footer
			var footerHtml = '';
			if(tips || btnText1 || btnText2) {
				footerHtml = '<div class="float-ft cf"> ';
				footerHtml += '<div class="float-message"> ' + '<a id="' + msgId + '"></a> ' + '</div> ';
				if(btnText1 || btnText2) {
					footerHtml += '<div class="float-actions"><div id="' + tipsId + '" class="help-inline">' + tips + '</div>';
					btnText1 && function() {
						var rawHtml = '<input type="button" id="' + btnId1 + '"  value="' + btnText1 + '"  class="f-btn  f-btn-primary"/> '; 
	                    footerHtml += rawHtml;
					}();
					btnText2 && (footerHtml += '<input type="button" id="' + btnId2 + '" value="' + btnText2 + '"  class="f-btn"/> ');
					footerHtml += '</div>';
				}
				footerHtml += '</div>';
			}
	
			var winSizeClass = {1: 'min', 2: 'mid'}[opts.winSize] || 'min';
			var contentClass = {1: '', 2: 'form-horizontal', 3: 'float-confirm float-confirm-success', 4: 'float-confirm float-confirm-warn', 5: 'float-confirm float-confirm-attent', 6: 'float-confirm float-confirm-error'}[opts.type] || '';
			var strHtml = 
	            ' <div id="' + dialogId + '" style="position: ' + dialogPosition + '; z-index: ' + zIndex + '" class="gri-float ' + winSizeClass + '">' 
	            + '		<div class="float-hd cf"> ' 
	            + '			<h3 class="float-title">' + opts.title + '</h3> '
	            + '         <a id="' + closeIconId + '" href="javascript:void(0);" class="close">&times;</a> ' 
	            + '		</div>' 
	            + '		<div class="float-bd"> ' 
	            + '			<div class="' + contentClass + '" id="' + contentId + '"> ' + '			</div> ' 
	            + '		</div> ' 
	            + footerHtml 
	            + '	</div> ';
	
			if(!$('#' + dialogId)[0]) {
				$(strHtml).appendTo("body");
			}
	
			//填充内容
			var content = opts.content;
			var cssInfo = {3: 'success', 4:'attent', 5:'warn', 6:'error'}[opts.type] || '';
			cssInfo && ( content = 
	              ' 	<i class="icon-confirm"></i> ' 
	            + '	    <div class="confirm-cont"> ' 
	            + '			<h4>' + opts.content + '</h4> ' 
	            + '			<p>' + opts.detail + '</p> ' 
	            + '		</div> ');
			$('#' + contentId).html(content);
	
			$("#" + dialogId).show();
	
			//处理对话框宽度
			var dialogWidth = extra['width'] ? parseInt(extra['width']) + 'px' : '';
			$('#' + contentId).css({
				"width" : dialogWidth
			});
			$('#' + dialogId).css({
				"width" : dialogWidth
			});
			//处理对话框位置
			dialogLeft = extra['left'] || ($(window).width() - $('#' + dialogId).width()) / 2;
			dialogTop = extra['top'] || ($(window).height() - $('#' + dialogId).height()) / 2;
			$("#" + dialogId).css({
				"top" : dialogTop + "px",
				"left" : dialogLeft + "px"
			});
	
			//点击回调函数
			$('#' + btnId1).click(function() {
				buttonClick('btn1');
			});
			$('#' + btnId2).click(function() {
				buttonClick('btn2');
			});
			$('#' + closeIconId).click(function() {
				buttonClick('btnClose');
			});
	
			opts.hideCloseIcon && $('#' + closeIconId).css('display', 'none');
	
			var noPrompt = (extra && typeof (extra['noPrompt']) != 'undefined') ? extra['noPrompt'] : false;
			if(noPrompt) {
				$('#' + 'promptOff').html('<input type="checkbox" id="noDataPromptOff" name="noDataPromptOff" value="1" style="position:relative;top:2px;"/> 不再提醒 ');
			}
			//自动遮盖
			opts.extra.autoMask && mask.create();
			
			//窗口是否可拖拽
			//opts.extra.draggable && $('#'+ dialogId).drag({handler:$('.float-hd')});
			opts.extra.draggable && $('#'+ dialogId).drag({handler:$('.float-hd')});
			
			// 解决IE6select控件bug
			var hidIframeId = "frm_100_" + dialogId;
			//如果已经存在，那么删除
			if($("#" + hidIframeId)) {
				$("#" + hidIframeId).remove();
			}
			hidIframe = "<iframe id=\"" + hidIframeId + "\"></iframe>";
			$(hidIframe).appendTo("body");
			zIndex = parseInt(zIndex);
			zIndex--;
			$("#" + hidIframeId).css({
				"width" : dialogWidth,
				"height" : $("#" + dialogId).height(),
				"position" : dialogPosition,
				"top" : $("#" + dialogId).css("top"),
				"left" : $("#" + dialogId).css("left"),
				"z-index" : zIndex,
				"scrolling" : "no",
				"border" : "0"
			});
		}, buttonClick = function(btnName) {
			//仅支持第一个按钮的点击调用回调函数
			(btnName == 'btn1' && callback) ? function() {
				callback();
				if(opts.extra.autoClose) {
					self.hideWindows();
				}
			}() : self.hideWindows();
		};
		
	
		//关闭窗口
		this.hideWindows = function() {
			var dialogId = self.dialogId;
			$("#" + dialogId).hide();
			$("#" + dialogId).remove();
			$("#frm_100_" + dialogId).remove();
			//解决IE浏览器下a标签不向上冒泡的问题
			if($("div[id^='calendar_']")) {
				$("div[id^='calendar_']").css('display', 'none');
			}
			opts.extra.autoMask && mask.destroy();
			//从集合中清除指定对话框
			return false;
		};
		this.closeWindows = this.hideWindows;
		
		//处理窗口提示信息
		this.showTips = function(msg) {
			var tipsId = self.dialogId + '_tips';
			$("#" + tipsId).html(msg);
		}, this.clearTips = function() {
			var tipsId = self.dialogId + '_tips';
			$("#" + tipsId).html('');
		}, this.showMsg = function(html){
			var msgId = self.dialogId + '_msg';
			$("#" + msgId).html(html);
		};
		
		//创建窗体
		create();
		return this;
	};
})();


