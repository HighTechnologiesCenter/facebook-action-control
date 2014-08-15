/**
 * Created for Vedomosti.ru.
 * User: vadim
 * Date: 29.03.12
 * Time: 15:20
 */
(function ($$$) {
    var FBActionControl = Class.create({
        // Здесь происходит первичная иницализация переменных и того что зависит от инициализированных компонентов facebook'a и не зависит от юзер контролов
        initialize:function (controlID) {
            this.controlID = controlID;
            this.cookies = {};
            this.initialized = false;
            this.action_url = "";
            this.action_type = "";
            this.init_control();
        },
        // Здесь мы инициализируем контролы которые к этому моменту уже успели подгрузиться на клиенте
        init_control:function () {
            if (typeof($$('#' + this.controlID)) != 'undefined' && typeof(this.control) == 'undefined')
                this.control = $$('#' + this.controlID).first();
            if (typeof(FB) != 'undefined' && !this.fbIsInit && typeof(this.control) != 'undefined') {
                this.fbIsInit = true;
                FB.context = this;
                FB.Event.subscribe("auth.authResponseChange", function (response, test) {
                    FB.context.isInit = undefined;
                    if (!response.authResponse) response.status = 'unknown';
                    if (response.status == 'unknown') {
                        FB.context.control.select(".avatar").first().innerHTML = "";
                        FB.context.control.select(".name").first().innerHTML = "";
                        FB.context.control.select("div.fb_activity_baloon div.list_articles").first().innerHTML = "";
                    }
                    FB.context.screens.init_screen_checkpermissions(response.status, FB.context);
                });
                FB.getLoginStatus(function (response) {
                    FB.context.screens.init_screen_checkpermissions(response.status, FB.context);
                });

                this.control.select("a.fb_button").first().observe("click", function (e) {
                    FB.login(function (response) {
                        if (response.authResponse) {
                        } else {
                        }
                    }, {scope:'publish_actions'});
                });

                this.control.select("a.settings").first().observe("click", function (e) {
                    showBaloon(this, -240, 22, $('settings'), 1, 240, undefined, 0,'bln_topright');
//                    $$("#baloon_content a.friends").first().observe("click", function(e) {
//                        FB.ui({
//                            "method" : 'apprequests',
//                            "message" : 'Поделитесь с друзьями о том что читали на www.vedomosti.ru'
//                        }, function(response) {
//                        });
//                        baloon_exclusive = false;
//                        hideBaloon(0, true);
//                    });
                    $$("#baloon_content a.logout").first().observe("click", function (e) {
                        FB.logout();
                        baloon_exclusive = false;
                        hideBaloon(0, true);
                    });
                    $$("#baloon_content a.deleteapp").first().observe("click", function (e) {
                        FB.api("me/permissions", "DELETE", function (response) {
                            if (response) {
                                FB.context.saver.cookie.set(FB.context, "show_user_activity", "off", true);
                                FB.context.saver.cookie.set(FB.context, "installed", "off", function () {
                                    FB.context.isInit = undefined;
                                    FB.context.screens.init_screen("unknown", FB.context);
//                                    window.location.reload();
                                });
                            }
                        });
                        baloon_exclusive = false;
                        hideBaloon(0, true);
                    });
                });

                this.control.select("#switch a").each(function (e, i) {
                    e.observe("click",
                        function (e) {
                            FB.context.sub_controls.switcher.init(FB.context, "toggle");
                        });
                });
                this.control.select("p.activity a").first().observe("click", function (e) {
                    showBaloon(this, -290, 20, $('activity'), 1, 320, undefined, 0,'bln_topright');
                    $$("#baloon_content div.last_articles a.shut").each(function (e, i) {
                        e.observe("click", function (e) {
                            var idstr = e.currentTarget.parentElement.id;
                            FB.context.facebook.remove(idstr.substring(5), function (response) {
                                FB.context.numOffer2 = 1;
                                FB.context.popups.activites_reload(FB.context);
                            });
                        });
                    });
                });
                this.control.select("input").each(function (e, i) {
                    if (FB.context.saver.cookie.get(FB.context, "show_user_activity") == "off") {
                        e.removeAttribute("checked");
                    } else {
                        e.writeAttribute("checked", "checked");
                    }
                });
            }
        },
        screens:{
            loader_on:function (context) {
                context.control.addClassName("loading");
                var user_info_ctrl = context.control.select("div.user_info").first();
                if (user_info_ctrl.visible()) {
                    user_info_ctrl.writeAttribute("isvisible", "true");
                    user_info_ctrl.hide();
                }
                var welcome_ctrl = context.control.select("#welcome").first();
                if (welcome_ctrl.visible()) {
                    welcome_ctrl.writeAttribute("isvisible", "true");
                    welcome_ctrl.hide();
                }
            },
            loader_off:function (context) {
                context.control.removeClassName("loading");
                var user_info_ctrl = context.control.select("div.user_info").first();
                if (user_info_ctrl.readAttribute("isvisible") == "true") {
                    user_info_ctrl.show();
                    user_info_ctrl.writeAttribute("isvisible", "false");
                }
                var welcome_ctrl = context.control.select("#welcome").first();
                if (welcome_ctrl.readAttribute("isvisible") == "true") {
                    welcome_ctrl.show();
                    welcome_ctrl.writeAttribute("isvisible", "false");
                }
            },
            user_info:function (context) {
                FB.context = context;
                var batch = '[{"method":"GET", "relative_url":"me/?fields=first_name,last_name,link,username,picture"},{"method":"GET", "relative_url":"me/news.reads?date_format=U&limit=5"}]'.evalJSON().toJSON();
                FB.api(
                    "me",
                    "POST",
                    {
                        "batch":batch
                    },
                    function (response) {
                        if (response[0] && response[1]) {
                            FB.context.data_user = response[0].body.evalJSON();
                            FB.context.data_articles = response[1].body.evalJSON();

                            // У фейсбука стало плохо с апи куков отключаем.
//                                FB.api({
//                                    "method" : "data.getCookies"
//                                }, function(response_cookie) {
//                                    // разбираемся с куками
//                                    if (response.size() > 0)
//                                        for (var i = 0; i < response_cookie.size(); i++) {
//                                            var i_arr = i;
//                                            FB.context.saver.cookie.set(FB.context, response_cookie[i_arr].name, response_cookie[i_arr].value, true);
//                                        }

                            if (FB.context.saver.cookie.get(FB.context, "installed") == "off" || !FB.context.saver.cookie.get(FB.context, "installed")) {
                                FB.context.sub_controls.switcher.init(FB.context, "on");
                            } else {
                                FB.context.sub_controls.switcher.init(FB.context, FB.context.saver.cookie.get(FB.context, "feed_switch"));
                            }
                            FB.context.control.select(".avatar").first().innerHTML = "<a><img/></a>";
                            var link = FB.context.control.select(".avatar a").first();
                            var img = FB.context.control.select(".avatar img").first();
                            link.writeAttribute("href", FB.context.data_user.link)
                                .writeAttribute("target", "_blank")
                                .writeAttribute("rel", "nofollow");
                            img.writeAttribute("src", FB.context.data_user.picture.data.url)
                                .writeAttribute("width", "50")
                                .writeAttribute("height", "50")
                                .writeAttribute("alt", FB.context.data_user.first_name + ' ' + FB.context.data_user.last_name)
                                .writeAttribute("title", FB.context.data_user.first_name + ' ' + FB.context.data_user.last_name);
                            FB.context.control.select(".name").first().innerHTML = "<a></a>";
                            var link = FB.context.control.select(".name a").first();
                            link.writeAttribute("href", FB.context.data_user.link)
                                .writeAttribute("target", "_blank")
                                .writeAttribute("rel", "nofollow");
                            link.innerHTML = FB.context.data_user.first_name + ' ' + FB.context.data_user.last_name;
                            FB.context.popups.activites(FB.context, FB.context.data_articles.data);
                            FB.context.control.select("div.user_info").first().show();
                            FB.context.screens.loader_off(context);
//                                });
                        } else {
                            FB.context.numOffer++; // Если данные не подгрузились пробуем еще
                            if (FB.context.numOffer < 5) {
                                FB.context.screens.user_info(FB.context);
                            } else {
                                FB.context.screens.loader_off(FB.context);
                            }
                        }
                        FB.context.initialized = true;
                        if (FB.context.action_type && FB.context.action_url){
                            if (FB.context.action_type=="read_news"){
                                FB.context.FBActions.read.news(FB.context.action_url);
                            }
                        }
                    }
                );
            },

            init_screen_checkpermissions:function (status, context) {
                if (status != "unknown") {
                    var permsNeeded = 'publish_actions';
                    FB.api('/me/permissions', function (response) {
                        var isPermitted = false;
                        if (typeof response.data != "undefined") {
                            var permsArray = response.data[0];
                            for (var perm in permsArray) {
                                if (perm == permsNeeded) {
                                    isPermitted = true;
                                    break;
                                }
                            }
                        }
                        if (!isPermitted) {
                            status = "unknown";
                        }
                        FB.context.screens.init_screen(status, context);
                    });
                } else {
                    FB.context.screens.init_screen(status, context);
                }
            },

            init_screen:function (status, context) {
                if (typeof(context.isInit) == 'undefined') {
                    context.screens.loader_on(context);
                    context.isInit = true;

                    context.control.select("div.user_info").first().hide();
                    context.control.select("#welcome").first().hide();

                    if (status == "unknown" || status == "not_authorized" || status == "app-not-added") {
                        context.control.select("#welcome").first().show();
                        context.control.select("div.user_info").first().writeAttribute("isvisible", "false");
                        context.screens.loader_off(context);
                    } else {
                        context.numOffer = 1;
                        context.control.select("#welcome").first().writeAttribute("isvisible", "false");
                        context.screens.user_info(context);
                    }
                }
            }},
        popups:{
            activity:function (context, id) {
                showBaloon($('fb_bar'), -115, 61, $('added'), 1, 300,'','','bln_topright');
                var elem = $$("#baloon_content div.fb_switch_baloon a").first();
                elem.writeAttribute("id", "postdel_" + id);
                elem.observe("click", function (e) {
                    var item_id = e.currentTarget.readAttribute("id").substring(8);
                    FB.context.facebook.remove(item_id, function () {
                        FB.context.numOffer2 = 1;
                        FB.context.popups.activites_reload(FB.context);
                    });
                    baloon_exclusive = false;
                    hideBaloon(0, true);
                });
                $$("#baloon_content input[type=checkbox]").each(function (e, i) {
                    e.observe("click", function (el) {
                        FB.context.saver.cookie.set(FB.context, "show_user_activity", (el.currentTarget.checked ? "on" : "off"), true);
                        FB.context.control.select("input[type=checkbox]").each(function (e, i) {
                            if (FB.context.saver.cookie.get(FB.context, "show_user_activity") == "off") {
                                e.removeAttribute("checked");
                            } else {
                                e.writeAttribute("checked", "checked");
                            }
                        });
                    });
                });
                $$("#baloon_content input[type=button]").each(function (e, i) {
                    e.observe("click", function (el) {
                        baloon_exclusive = false;
                        hideBaloon(0, true);
                    });
                });
            },
            activites_reload:function (context) {
                FB.context = context;
                context.screens.loader_on(context);
                var batch = '[{"method":"GET", "relative_url":"me/news.reads?date_format=U"}]'.evalJSON().toJSON();
                FB.api(
                    "me",
                    "POST",
                    {
                        "limit":5,
                        "batch":batch
                    },
                    function (response) {
                        if (response.error) {
                        }
                        else {
                            if (response[0]) {
                                FB.context.data_articles = response[0].body.evalJSON();
                                FB.context.popups.activites(FB.context, FB.context.data_articles.data);
                            } else {
                                FB.context.numOffer2++; // Если данные не подгрузились пробуем еще
                                if (FB.context.numOffer2 < 5) {
                                    FB.context.popups.activites_reload(FB.context);
                                } else {
                                    FB.context.screens.loader_off(FB.context);
                                }

                            }
                        }
                        context.screens.loader_off(FB.context);
                    });
            },
            activites:function (context, data) {
                var feed = FB.context.control.select("div.list_articles").first();
                var popup = $$("#baloon_content div.list_articles").first();
                if (feed) {
                    feed.innerHTML = "";
                    if (data.size() > 0) {
                        var items = '';
                        for (var i = 0; i < (( data.size() < 5 ) ? data.size() : 5 ); i++) {
                            var item = data[i].data.article;
                            items += '<div class="header3" id="post_' + data[i].id + '"><a class="shut" title="Удалить">Удалить</a><a href="' + item.url + '" target="_blank">' + item.title + '</a></div>';
                        }
                        feed.innerHTML += items;
                    } else
                        feed.innerHTML += '<div class="header3" id="empty_activite">Здесь будут появляться статьи, которые Вы прочитали</div>';
                }
                if (popup) {
                    popup.innerHTML = "";
                    if (data.size() > 0) {
                        var items = '';
                        for (var i = 0; i < (( data.size() < 5 ) ? data.size() : 5 ); i++) {
                            var item = data[i].data.article;
                            items += '<div class="header3" id="post_' + data[i].id + '"><a class="shut" title="Удалить">Удалить</a><a href="' + item.url + '" target="_blank">' + item.title + '</a></div>';
                        }
                        popup.innerHTML += items;
                    } else
                        popup.innerHTML += '<div class="header3" id="empty_activite">Здесь будут появляться статьи, которые Вы прочитали</div>';
                    popup.select("a.shut").each(function (e, i) {
                        e.observe("click", function (e) {
                            var idstr = e.currentTarget.parentElement.id;
                            FB.context.facebook.remove(idstr.substring(5), function (response) {
                                FB.context.numOffer2 = 1;
                                FB.context.popups.activites_reload(FB.context);
                            });
                        });
                    });
                }
            }},
        saver:{
            cookie:{
                set:function (context, name, value, callback) {
                    Cookies.create(name, value, 365, 'vedomosti.ru');
                    context.cookies[name] = value;
                    if (typeof(callback) == 'function')
                        callback();

// У Фейсбука как то плохо с куками стало отключаем
//                    FB.api(
//                    {
//                        "method" : "data.setCookie",
//                        "name" : name,
//                        "value" : value
//                    }, function(response) {
//                                if (typeof(callback) == 'function')
//                                    callback();
//                            });
                },
                get:function (context, name) {
                    if (typeof( context.cookies["" + name] ) != "undefined")
                        return context.cookies[name];
                    else {
                        Cookies.init();
                        return Cookies.read(name);
                    }
                }
            }},
        facebook:{
            create:function (object, action, object_type, object_target, data, callback) {
                settings = {};
                settings[ object_type ] = object_target;
                FB.api(
                    "me/" + object + "." + action,
                    "post",
                    settings,
                    function (response) {
                        if (response.error) {
                        }
                        else {
                            if (typeof( callback ) == "function")
                                callback(response);
                        }
                    });
            },
            remove:function (id, callback) {
                FB.api(
                    id,
                    "delete",
                    function (response) {
                        if (response) {
                            if (typeof( callback ) == "function")
                                callback(response);
                        }
                    });
            }},
        FBActions:{
            read:{
                news:function (url) {
                    if (FB.context.initialized) {
                        FB.context.action_type = "";
                        FB.context.action_url = "";
                        if (FB.context.saver.cookie.get(FB.context, "feed_switch") == "on") {
                            FB.context.facebook.create("news", "reads", "article", url, null, function (response) {
                                if (response.id) {
                                    FB.context.numOffer2 = 1;
                                    FB.context.popups.activites_reload(FB.context);
                                    if (FB.context.saver.cookie.get(FB.context, "show_user_activity") != "off") {
                                        FB.context.popups.activity(FB.context, response.id);
                                    }
                                }
                            });
                        }
                    } else {
                        FB.context.action_type = "read_news";
                        FB.context.action_url = url;
                    }
                }}},
        sub_controls:{
            switcher:{
                on:function (context, status) {
                    context.control.select("#switch").first().removeClassName("switch_off").addClassName("switch_on");
                    context.control.select("#switch span").first().innerHTML = "Включен";
                    var before_status = (status ? status : context.saver.cookie.get(context, "feed_switch"));
                    context.saver.cookie.set(context,
                        "feed_switch", "on", function () {
                            if (before_status == "off") {
                                showBaloon(context.control.select("#switch").first(), -130, 22, $('switcher_on'), 1, 300, undefined, 0,'bln_topcenter');
                                $$("#baloon_content a.baloon_switcher").each(function (e, i) {
                                    e.observe("click", function (el) {
                                        if (e.innerHTML == "Выключить")
                                            FB.context.sub_controls.switcher.off(FB.context, "off");
                                        else
                                            FB.context.sub_controls.switcher.on(FB.context, "on");
                                    });
                                });

                                $$("#baloon_content input").each(function (e, i) {
                                    e.observe("click", function (el) {
                                        FB.context.saver.cookie.set(FB.context, "show_user_activity", (el.currentTarget.checked ? "on" : "off"), true);
                                        FB.context.control.select("input[type=checkbox]").each(function (e, i) {
                                            if (FB.context.saver.cookie.get(FB.context, "show_user_activity") == "off") {
                                                e.removeAttribute("checked");
                                            } else {
                                                e.writeAttribute("checked", "checked");
                                            }
                                        });
                                    });
                                });

                            } else {
                                baloon_exclusive = false;
                                hideBaloon(0, true);
                            }
                            FB.context.saver.cookie.set(FB.context, "installed", "on", true);
                        }
                    );
                },
                off:function (context, status) {
                    context.control.select("#switch").first().removeClassName("switch_on").addClassName("switch_off");
                    context.control.select("#switch span").first().innerHTML = "Выключен";
                    var before_status = (status ? status : context.saver.cookie.get(context, "feed_switch"));
                    context.saver.cookie.set(context,
                        "feed_switch", "off", function () {
                            if (before_status == "on") {
                                showBaloon(context.control.select("#switch").first(), -130, 22, $('switcher_off'), 1, 300, undefined, 0,'bln_topcenter');
                                $$("#baloon_content a.baloon_switcher").each(function (e, i) {
                                    e.observe("click", function (el) {
                                        if (e.innerHTML == "Выключить")
                                            FB.context.sub_controls.switcher.off(FB.context, "off");
                                        else
                                            FB.context.sub_controls.switcher.on(FB.context, "on");
                                    });
                                });

                                $$("#baloon_content input").each(function (e, i) {
                                    e.observe("click", function (el) {
                                        FB.context.saver.cookie.set(FB.context, "show_user_activity", (el.currentTarget.checked ? "on" : "off"), true);
                                        FB.context.control.select("input").each(function (e, i) {
                                            if (FB.context.saver.cookie.get(FB.context, "show_user_activity") == "off") {
                                                e.removeAttribute("checked");
                                            } else {
                                                e.writeAttribute("checked", "checked");
                                            }
                                        });
                                    });
                                });
                            } else {
                                baloon_exclusive = false;
                                hideBaloon(0, true);
                            }
                        }
                    );

                },
                init:function (context, type) {
                    if (type == "on") {
                        context.sub_controls.switcher.on(context);
                    } else if (type == "off") {
                        context.sub_controls.switcher.off(context);
                    } else {
                        var switcher = context.control.select("#switch").first();
                        if (switcher.hasClassName("switch_on"))
                            context.sub_controls.switcher.off(context);
                        else if (switcher.hasClassName("switch_off"))
                            context.sub_controls.switcher.on(context);
                    }
                }
            }
        }
    });
    $$$.FBActionControl = FBActionControl;
})(Prototype)