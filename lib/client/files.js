/* load and store templates data */

var Util, DOM, Promise;

(function(Util, DOM) {
    'use strict';
    
    var DOMProto    = Object.getPrototypeOf(DOM);
    
    DOMProto.Files = new FilesProto(Util, DOM);
    
    function FilesProto(Util, DOM) {
        var Promises        = {},
            Storage         = DOM.Storage,
            Files           = this,
            FILES_JSON      = 'config|modules|ext',
            FILES_HTML      = 'file|path|link|pathLink|media',
            FILES_HTML_ROOT = 'view/media-tmpl|config-tmpl',
            funcs           = [],
            Data            = {},
            DIR_HTML        = '/html/',
            DIR_HTML_FS     = DIR_HTML + 'fs/',
            DIR_JSON        = '/json/';
        
        this.get            = function(name, callback) {
            var type    = Util.getType(name);
            
            Util.checkArgs(arguments, ['name', 'callback']);
            
            switch(type) {
            case 'string':
                getModule(name, callback);
                break;
            
            case 'array':
                funcs = name.map(function(name) {
                    return function(callback) {
                        Files.get(name, callback);
                    };
                });
                
                Util.exec.parallel(funcs, callback);
                break;
            }
            
            return Files;
        };
        
        this.set            = function(name, data, callback) {
            var strFiles    = FILES_JSON + FILES_HTML + FILES_HTML_ROOT,
                regExp      = new RegExp(strFiles),
                isFile      = name.match(regExp);
            
            Util.checkArgs(arguments, [name, data]);
            
            if (!isFile) {
                showError(name);
            } else {
                Data[name] = data;
                callback(null);
            }
            
            if (name === 'config')
                setConfig(data);
            
            return Files;
        };
        
        function getModule(name, callback) {
            var path,
                
                regExpHTML  = new RegExp(FILES_HTML + FILES_HTML_ROOT),
                regExpJSON  = new RegExp(FILES_JSON),
                
                isHTML      = name.match(regExpHTML),
                isJSON      = name.match(regExpJSON);
            
            if (!isHTML && !isJSON) {
                showError(name);
            } else if (name === 'config') {
                getConfig(callback);
            } else {
                path = getPath(name, isHTML, isJSON);
                
                getSystemFile(path , callback);
            }
               
        }
        
        function getPath(name, isHTML, isJSON) {
            var path,
                regExp  = new RegExp(FILES_HTML_ROOT),
                isRoot  = name.match(regExp);
            
            if (isHTML) {
                if (isRoot)
                    path = DIR_HTML + Util.rmStr(name, '-tmpl');
                else
                    path = DIR_HTML_FS  + name;
                
                path += '.html';
            } else if (isJSON) {
                path = DIR_JSON  + name + '.json';
            }
            
            return path;
        }
        
        function showError(name) {
            var str     = 'Wrong file name: ' + name,
                error   = new Error(str);
            
            throw(error);
        }
        
        function getSystemFile(url, callback) {
            if (!Promises[url])
                Promises[url] = new Promise(function(resolve, reject) {
                        DOM.load.ajax({
                        url     : url,
                        success : resolve,
                        error   : reject
                    });
                });
            
            Promises[url].then(function(data) {
                if (!Data[url])
                    Data[url] = data;
                
                callback(null, data);
            }, function(error) {
                callback(error);
            });
        }
        
        function getConfig(callback) {
            var RESTful = DOM.RESTful;
            
            if (!Promises.config)
                Promises.config = new Promise(function(resolve) {
                    RESTful.Config.read(resolve);
                });
            
            Promises.config.then(function(data) {
                if (!Data.config) {
                    Data.config = data;
                    Storage.setAllowed(data.localStorage);
                }
                
                callback(null, data);
            });
        }
        
        function setConfig(config) {
            var isStorage   = config.localStorage;
            
            Storage.setAllowed(isStorage);
        }
    }
})(Util, DOM);
