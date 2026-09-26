// verbomio.app: shows the page in one language, and on the support page lists the open issues.
// Without JavaScript every language shows, one after another, and the issues are a link away on GitHub.
(function () {
  var languages = ["en", "es", "ru", "uk"];

  // ?lang= in the address, then the last choice, then the browser's languages; English if none of the four.
  function pick() {
    var asked = new URLSearchParams(location.search).get("lang");
    if (languages.indexOf(asked) >= 0) return asked;
    try {
      var saved = localStorage.getItem("lang");
      if (languages.indexOf(saved) >= 0) return saved;
    } catch (e) {}
    var list = navigator.languages || [navigator.language || "en"];
    for (var i = 0; i < list.length; i++) {
      var code = String(list[i]).slice(0, 2).toLowerCase();
      if (languages.indexOf(code) >= 0) return code;
    }
    return "en";
  }

  function show(language) {
    document.documentElement.lang = language;
    document.querySelectorAll(".lang").forEach(function (section) {
      section.hidden = section.dataset.lang !== language;
      if (!section.hidden && section.dataset.title) document.title = section.dataset.title;
    });
    document.querySelectorAll(".chips a").forEach(function (chip) {
      chip.setAttribute("aria-current", chip.dataset.lang === language ? "true" : "false");
    });
  }

  document.querySelectorAll(".chips a").forEach(function (chip) {
    chip.addEventListener("click", function (event) {
      event.preventDefault();
      try { localStorage.setItem("lang", chip.dataset.lang); } catch (e) {}
      show(chip.dataset.lang);
    });
  });
  show(pick());

  // Email addresses: the page's source holds each one's name and domain backwards and apart, with no @, which
  // keeps them away from address harvesters; here they become ordinary mailto: links.
  document.querySelectorAll("a.email").forEach(function (link) {
    function forwards(text) { return text.split("").reverse().join(""); }
    var address = forwards(link.dataset.u) + "@" + forwards(link.dataset.d);
    link.href = "mailto:" + address;
    link.textContent = address;
  });

  // The support page's open issues, read from GitHub's API (a public repository needs no sign-in to read).
  var lists = document.querySelectorAll("ul.issues");
  if (!lists.length) return;
  var repo = lists[0].dataset.repo;

  function fill(build) {
    lists.forEach(function (list) {
      list.textContent = "";
      build(list);
    });
  }

  function line(list, text, href) {
    var item = document.createElement("li");
    if (href) {
      var link = document.createElement("a");
      link.href = href;
      link.textContent = text;
      item.appendChild(link);
    } else {
      item.textContent = text;
    }
    list.appendChild(item);
    return item;
  }

  fetch("https://api.github.com/repos/" + repo + "/issues?state=open&per_page=50",
        { headers: { Accept: "application/vnd.github+json" } })
    .then(function (response) {
      if (!response.ok) throw new Error(String(response.status));
      return response.json();
    })
    .then(function (items) {
      items = items.filter(function (issue) { return !issue.pull_request; });
      fill(function (list) {
        if (!items.length) { line(list, list.dataset.none); return; }
        items.forEach(function (issue) {
          var item = line(list, issue.title, issue.html_url);
          (issue.labels || []).forEach(function (label) {
            var tag = document.createElement("span");
            tag.className = "label";
            tag.textContent = label.name;
            item.appendChild(tag);
          });
        });
      });
    })
    .catch(function () {
      fill(function (list) { line(list, list.dataset.error, "https://github.com/" + repo + "/issues"); });
    });
})();
