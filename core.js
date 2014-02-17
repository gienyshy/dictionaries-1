// #######################################################################
//  Copyright (C) 2013 revir.qing@gmail.com
// 
//  This program is free software; you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation; either version 2, or (at your option)
//  any later version.
// 
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
// 
//  You should have received a copy of the GNU General Public License
//  along with this program; if not, write to the Free Software Foundation,
//  Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.  
//  
//  Author: Revir Qing (aguidetoshanghai.com)
//  URL: www.aguidetoshanghai.com

function setBrowserIcon(enable) {
    var title = '已打开鼠标取词功能',
        imgPath = 'images/dict-on24.png';
    if (!enable) {
        title = '已关闭鼠标取词功能';
        imgPath = 'images/dict-off24.png';
    }
    chrome.browserAction.setTitle({
        title: title
    });
    chrome.browserAction.setIcon({
        path: imgPath
    });
}

function sendQueryResult(queryResult) {
    if (dictWindowManager.sendMessage('queryResult', queryResult)) {
        queryResultCache = {};
    } else {
        queryResultCache = queryResult;
    }
}

function _queryDict(text, dictionary){
    var _onSuccess = function(data) {
        var result = {
            text: text,
            data: data
        };
        sendQueryResult(result);
    };
    var _onFail = function() {
        var result = {
            text: text,
            data: ''
        };
        sendQueryResult(result);
    };
    dictWindowManager.open();

    dictionary = dictionary || dictManager.defaultDict;
    dictManager.defaultDict = dictionary;
    if (text){
        dictWindowManager.sendMessage('waitResult');
        dictManager.queryDict(text, dictionary, _onSuccess, _onFail);
    }
}

function onClickedContextMenu(info, tab){
    if(info.selectionText)
        _queryDict(info.selectionText);
}

var queryResultCache = {};
chrome.browserAction.onClicked.addListener(function(tab) {
    var b = !Settings.getValue('enableMinidict');
    Settings.setValue('enableMinidict', b);
    setBrowserIcon(b);
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.type === 'keySettings') {
            sendResponse({
                specialKeys: Settings.getValue('specialKeys'),
                normalKey: Settings.getValue('normalKey')
            });
        } else if (request.type === 'saveKeySettings'){
            Settings.setValue('specialKeys', request.specialKeys);
            Settings.setValue('normalKey', request.normalKey);
        } else if (request.type === 'dictReady') {
            console.info('dictReady...');
            dictWindowManager.dictIsReady = true;
            dictWindowManager.sendMessage('info', {
                dictList: dictManager.allDicts,
                defaultDictName: dictManager.defaultDict.dictName
            });

            if(queryResultCache.data)
                sendQueryResult(queryResultCache);

        } else if (request.type === 'queryDict') {
            if (request.means === 'mouse' && !Settings.getValue('enableMinidict'))
                return;
            _queryDict(request.text, request.dictionary);
        }
    }
);

chrome.windows.onRemoved.addListener(function(wid) {
    if (dictWindowManager.dictWindow && wid === dictWindowManager.dictWindow.id) {
        dictWindowManager.dictIsReady = false;
        delete dictWindowManager.dictWindow;
    }
});

(function Init() {
    console.info('[temp] core init...');
    Settings.init(function(){
        setBrowserIcon(Settings.getValue('enableMinidict'));
    });

    //set contextMenu
    chrome.contextMenus.create({
        title: "使用 FairyDict 查询 '%s'",
        contexts: ["selection"],
        onclick: onClickedContextMenu
    });
}());