// Generated by CoffeeScript 1.10.0
chrome.runtime.sendMessage({
  type: 'setting'
}, function(setting) {
  var getWordAtPoint, handleLookupByMouse, handleMouseUp, handleSelectionWord, mouseMoveTimer, playAudios;
  mouseMoveTimer = null;
  jQuery(document).ready(function() {
    return jQuery('<div class="fairydict-tooltip">\n    <div class="fairydict-spinner">\n      <div class="fairydict-bounce1"></div>\n      <div class="fairydict-bounce2"></div>\n      <div class="fairydict-bounce3"></div>\n    </div>\n    <p class="fairydict-tooltip-content">\n    </p>\n</div>').appendTo('body');
  });
  jQuery(document).mousemove(function(e) {
    var mousex, mousey;
    mousex = e.pageX + 20;
    mousey = e.pageY + 10;
    jQuery('.fairydict-tooltip').css({
      top: mousey,
      left: mousex
    });
    if (setting.enableSelectionOnMouseMove) {
      if (!setting.enableSelectionSK1 || (setting.enableSelectionSK1 && utils.checkEventKey(e, setting.selectionSK1))) {
        return handleSelectionWord(e);
      }
    }
  });
  jQuery(document).mouseup(function(e) {
    return setTimeout((function() {
      return handleMouseUp(e);
    }), 1);
  });
  jQuery(document).bind('keyup', function(event) {
    if (utils.checkEventKey(event, setting.openSK1, setting.openSK2, setting.openKey)) {
      return chrome.runtime.sendMessage({
        type: 'look up',
        means: 'keyboard',
        text: window.getSelection().toString().trim()
      });
    }
  });
  handleSelectionWord = function(e) {
    if (mouseMoveTimer) {
      clearTimeout(mouseMoveTimer);
    }
    return mouseMoveTimer = setTimeout((function() {
      var word;
      word = getWordAtPoint(e.target, e.clientX, e.clientY);
      if (word) {
        console.log(word);
        return handleLookupByMouse(e);
      }
    }), setting.selectionTimeout || 500);
  };
  playAudios = function(urls) {
    var __play, _play, audios;
    if (!(urls != null ? urls.length : void 0)) {
      return;
    }
    audios = urls.map(function(url) {
      return new Audio(url);
    });
    _play = function(audio, timeout) {
      if (timeout == null) {
        timeout = 0;
      }
      return $.Deferred(function(dfd) {
        var _func;
        _func = function() {
          return setTimeout((function() {
            audio.play();
            return dfd.resolve(audio.duration || 1);
          }), timeout);
        };
        if (audio.duration) {
          return _func();
        } else {
          return audio.addEventListener('loadedmetadata', _func);
        }
      });
    };
    __play = function(idx, timeout) {
      if (idx == null) {
        idx = 0;
      }
      if (audios[idx]) {
        return _play(audios[idx], timeout).then(function(duration) {
          return __play(idx + 1, duration * 1000);
        });
      }
    };
    return __play();
  };
  getWordAtPoint = function(elem, x, y) {
    var currentPos, el, endPos, i, len, range, react, ref, sel;
    if (elem.nodeType === elem.TEXT_NODE) {
      range = elem.ownerDocument.createRange();
      range.selectNodeContents(elem);
      currentPos = 0;
      endPos = range.endOffset;
      while (currentPos + 1 < endPos) {
        range.setStart(elem, currentPos);
        range.setEnd(elem, currentPos + 1);
        if (range.getBoundingClientRect().left <= x && range.getBoundingClientRect().right >= x && range.getBoundingClientRect().top <= y && range.getBoundingClientRect().bottom >= y) {
          range.detach();
          sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          sel.modify("move", "backward", "word");
          sel.collapseToStart();
          sel.modify("extend", "forward", "word");
          return sel.toString().trim();
        }
        currentPos += 1;
      }
    } else {
      ref = elem.childNodes;
      for (i = 0, len = ref.length; i < len; i++) {
        el = ref[i];
        range = el.ownerDocument.createRange();
        range.selectNodeContents(el);
        react = range.getBoundingClientRect();
        if (react.left <= x && react.right >= x && react.top <= y && react.bottom >= y) {
          range.detach();
          return getWordAtPoint(el, x, y);
        } else {
          range.detach();
        }
      }
    }
  };
  handleMouseUp = function(event) {
    var including, selObj, text;
    selObj = window.getSelection();
    text = selObj.toString().trim();
    if (!text) {
      jQuery('.fairydict-tooltip').fadeOut().hide();
      return;
    }
    including = jQuery(event.target).has(selObj.focusNode).length || jQuery(event.target).is(selObj.focusNode);
    if (event.which === 1 && including) {
      return handleLookupByMouse(event);
    }
  };
  return handleLookupByMouse = function(event) {
    var text;
    text = window.getSelection().toString().trim();
    if (!text) {
      return;
    }
    if (setting.enablePlainLookup) {
      if (!setting.enablePlainSK1 || (setting.plainSK1 && utils.checkEventKey(event, setting.plainSK1))) {
        jQuery('.fairydict-tooltip').fadeIn('slow');
        jQuery('.fairydict-tooltip .fairydict-spinner').show();
        jQuery('.fairydict-tooltip .fairydict-tooltip-content').empty();
        chrome.runtime.sendMessage({
          type: 'look up pain',
          means: 'mouse',
          text: text
        }, function(res) {
          var audios, content;
          if (res != null ? res.defs : void 0) {
            content = '';
            if (res.pronunciation) {
              audios = [];
              if (res.pronunciation.AmE) {
                content += res.pronunciation.AmE + '&nbsp;&nbsp;';
              }
              if (res.pronunciation.AmEmp3 && setting.enableAmeAudio) {
                audios.push(res.pronunciation.AmEmp3);
              }
              if (res.pronunciation.BrE) {
                content += res.pronunciation.BrE + '<br/>';
              }
              if (res.pronunciation.BrEmp3 && setting.enableBreAudio) {
                audios.push(res.pronunciation.BrEmp3);
              }
              playAudios(audios);
            }
            content = res.defs.reduce((function(n, m) {
              if (n) {
                n += '<br/>';
              }
              n += m.pos + ' ' + m.def;
              return n;
            }), content);
            console.log("[FairyDict] plain definition: ", content);
            jQuery('.fairydict-tooltip .fairydict-spinner').hide();
            return jQuery('.fairydict-tooltip .fairydict-tooltip-content').html(content);
          } else {
            return jQuery('.fairydict-tooltip').fadeOut().hide();
          }
        });
      }
    }
    if (!setting.enableMouseSK1 || (setting.mouseSK1 && utils.checkEventKey(event, setting.mouseSK1))) {
      return chrome.runtime.sendMessage({
        type: 'look up',
        means: 'mouse',
        text: text
      });
    }
  };
});

chrome.runtime.sendMessage({
  type: 'injected',
  url: location.href
});
