/*
#  #
*/


(function() {
  var charset, check_complete, check_complete_interval, child_process, client_height, client_width, cookies, fs, headers, html_output, init_page, is_page_opened, is_page_scroll_to_bottom, last_resource_request_time, nextPage, on_timeout, output_dir, page, page_url, phantom_exit, plugin, read_args, request_ids, request_interval_timeout, request_timeout, requests, require_plugin, reset, response_ids, save, system, timeout, url;

  system = global.require("system");

  fs = global.require("fs");



  child_process = global.require("child_process");

  page = global.require("webpage").create();

  page_url = null;

  output_dir = null;

  html_output = null;

  client_width = 1280;

  client_height = 800;

  charset = 'auto';

  request_timeout = 5000;

  request_interval_timeout = 100;

  timeout = 60 * 1000;

  is_page_opened = false;

  cookies = [];

  headers = {};

  plugin = null;

  last_resource_request_time = null;

  request_ids = null;

  requests = [];

  response_ids = null;

  is_page_scroll_to_bottom = false;

  check_complete_interval = null;

  phantom_exit = function(status, error) {
    if (error == null) {
      error = '';
    }
    if ((error != null) && error.length > 0) {
      console.error(error);
    }
    return child_process.spawn("kill", ["-9", system.pid]);
  };

  phantom.onError = function(msg, trace) {
    var stack, t, _i, _len;
    stack = ['PHANTOM ERROR: ' + msg];
    if (trace && trace.length) {
      stack.push('TRACE:');
      for (_i = 0, _len = trace.length; _i < _len; _i++) {
        t = trace[_i];
        stack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t["function"] != null ? ' in function ' + t["function"] : ''));
      }
    }
    return phantom_exit(1, stack.join('\n'));
  };

  read_args = function() {
    var e;
    page_url = system.args[1];
    output_dir = system.args[2];
    html_output = system.args[3];
    client_width = parseInt(system.args[4]);
    client_height = parseInt(system.args[5]);
    charset = system.args[6];
    request_timeout = parseInt(system.args[7]);
    request_interval_timeout = parseInt(system.args[8]);
    timeout = parseInt(system.args[9]);
    try {
      cookies = JSON.parse(system.args[10]);
    } catch (_error) {
      e = _error;
      cookies = [];
    }
    try {
      return headers = JSON.parse(system.args[11]);
    } catch (_error) {
      e = _error;
      return headers = {};
    }
  };

  init_page = function() {
    var cookie, expires, _i, _len;
    is_page_opened = false;
    page.settings.resourceTimeout = request_timeout;
    page.viewportSize = {
      width: client_width,
      height: client_height
    };
    expires = (new Date()).getTime() + (1000 * 60 * 60);
    for (_i = 0, _len = cookies.length; _i < _len; _i++) {
      cookie = cookies[_i];
      cookie['httponly'] = page_url.indexOf('https://') === 0;
      cookie['expires'] = expires;
      phantom.addCookie(cookie);
    }
    page.settings.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.29 Safari/537.36';
    return page.customHeaders = headers;
  };



  reset = function() {
    last_resource_request_time = new Date().getTime();
    request_ids = [];
    return response_ids = [];
  };

  nextPage = function() {
    reset();
    return is_page_scroll_to_bottom = page.evaluate(function(pageHeight) {
      var lastScrollTop;
      if ((typeof document !== "undefined" && document !== null) && (document.body != null)) {
        lastScrollTop = document.body.scrollTop;
        document.body.scrollTop += pageHeight;
        return lastScrollTop === document.body.scrollTop;
      } else {
        return true;
      }
    }, page.viewportSize.height);
  };

  page.onResourceRequested = function(request) {
    if (request_ids.indexOf(request.id) === -1) {
      last_resource_request_time = new Date().getTime();
      request_ids.push(request.id);
      return requests.push({
        url: request.url,
        headers: request.headers
      });
    }
  };

  page.onResourceReceived = function(response) {
    if (request_ids.indexOf(response.id) !== -1 && response_ids.indexOf(response.id) === -1) {
      return response_ids.push(response.id);
    }
  };

  page.onResourceError = function(response) {
    console.log(response.url + ':' + response.errorString);
    if (request_ids.indexOf(response.id) !== -1 && response_ids.indexOf(response.id) === -1) {
      return response_ids.push(response.id);
    }
  };

  page.onResourceTimeout = function(response) {
    if (request_ids.indexOf(response.id) !== -1 && response_ids.indexOf(response.id) === -1) {
      return response_ids.push(response.id);
    }
  };

  check_complete = function() {
    var now;
    now = new Date().getTime();
    if (request_ids.length === response_ids.length) {
      if (now - last_resource_request_time > request_interval_timeout) {
        if (is_page_scroll_to_bottom) {
          return save();
        } else {
          return nextPage();
        }
      }
    }
  };

  on_timeout = function() {
    if (is_page_opened) {
      return save();
    } else {
      return phantom_exit(1, 'timeout');
    }
  };

  save = function() {
    var clipHeight, i, infos, max_height, offset, scrollHeight, scrollTop;
    window.clearInterval(check_complete_interval);
    //if (plugin) {
    //  plugin.on_full_loaded(page, addtional);
    //}
    fs.write(output_dir + "/" + html_output, page.content, "w");
    infos = {
      'title': page.title,
      'url': page.url,
      'cookies': page.cookies,
      'plain': page.plainText,
      'requests': requests
    };
    fs.write(output_dir + "/infos.json", JSON.stringify(infos), "w");
    scrollTop = page.evaluate(function() {
      return window.document.body.scrollTop;
    });
    scrollHeight = scrollTop + client_height;
    max_height = 32000;
    i = 0;
    while (true) {
      offset = i * max_height;
      if (offset >= scrollHeight) {
        break;
      }
      if (offset + max_height > scrollHeight) {
        clipHeight = scrollHeight - offset;
      } else {
        clipHeight = max_height;
      }
      page.clipRect = {
        top: offset,
        left: 0,
        width: client_width,
        height: clipHeight
      };
      page.render(output_dir + "/screenshot_" + i + ".png");
      i++;
    }
    return phantom_exit(0);
  };

  read_args();

  init_page();

  reset();

  setTimeout(on_timeout, timeout);

  page.open(page_url, function(status) {
    if (status !== 'success') {
      phantom_exit(1);
      return;
    }
    is_page_opened = true;
    page.evaluate(function() {
      if ((typeof document !== "undefined" && document !== null) && (document.body != null)) {
        return document.body.bgColor = 'white';
      }
    });

    //if (plugin) {
    //  plugin.on_loaded(page, addtional);
    //}
    return check_complete_interval = setInterval(check_complete, 100);
  });

}).call(this);

/*
//@ sourceMappingURL=scraping.js.map
*/
