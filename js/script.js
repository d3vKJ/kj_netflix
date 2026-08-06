$(function () {
  const $header = $(".header");
  const $back_top = $("#back-top");

  if ($header.length && $back_top.length) {
    const on_scroll = function () {
      const y = $(window).scrollTop();

      $header.toggleClass("header--scrolled", y > 40);
      $back_top.toggleClass("is-visible", y > 400);
    };

    $(window).on("scroll", on_scroll);
    on_scroll();

    $back_top.on("click", function () {
      $("html, body").animate({ scrollTop: 0 }, 400);
    });
  }

  // 히어로 섹션 사진비됴
  // 3초 후 비디오 재생하게 하는데 이미지 > 비디오 할때 페이드 인, 아웃 적용 비디오 > 이미지도 마찬가지로 작업
  const $hero = $(".hero");
  const $hero_video = $hero.find(".hero__video");
  const $hero_play_btn = $hero.find("[data-hero-play]");
  const $hero_pause_btn = $hero.find("[data-hero-pause]");
  const $hero_mute_btn = $hero.find("[data-hero-mute]");
  const hero_video = $hero_video.get(0);
  const FADE_MS = 600;
  const AUTO_PLAY_DELAY = 2000;
  const SCROLL_STOP_Y = 80;
  let hero_fade_timer = null;
  let hero_autoplay_timer = null;
  let hero_is_playing = false;
  let hero_is_paused = false;

  if ($hero.length && hero_video && $hero_play_btn.length && $hero_pause_btn.length && $hero_mute_btn.length) {
    const $mute_icon = $hero_mute_btn.find(".material-symbols-outlined");
    const $pause_icon = $hero_pause_btn.find(".material-symbols-outlined");

    const clear_fade_timer = function () {
      if (!hero_fade_timer) return;
      clearTimeout(hero_fade_timer);
      hero_fade_timer = null;
    };

    const clear_autoplay_timer = function () {
      if (!hero_autoplay_timer) return;
      clearTimeout(hero_autoplay_timer);
      hero_autoplay_timer = null;
    };

    const is_hero_in_view = function () {
      return $(window).scrollTop() <= SCROLL_STOP_Y;
    };

    const sync_mute_ui = function () {
      if (hero_video.muted) {
        $mute_icon.text("volume_off");
        $hero_mute_btn.attr("aria-label", "소리 켜기");
      } else {
        $mute_icon.text("volume_up");
        $hero_mute_btn.attr("aria-label", "음소거");
      }
    };

    const set_controls_ui = function (playing) {
      if (playing) {
        $hero_pause_btn.prop("hidden", false);
        $hero_mute_btn.prop("hidden", false);
        $pause_icon.text("pause");
        $hero_pause_btn.attr("aria-label", "일시정지");
        $hero.removeClass("is-paused");
        return;
      }

      if (hero_is_paused) {
        $hero_pause_btn.prop("hidden", false);
        $hero_mute_btn.prop("hidden", true);
        $pause_icon.text("play_arrow");
        $hero_pause_btn.attr("aria-label", "이어서 재생");
        $hero.addClass("is-paused");
        return;
      }

      $hero_pause_btn.prop("hidden", true);
      $hero_mute_btn.prop("hidden", true);
      $pause_icon.text("pause");
      $hero_pause_btn.attr("aria-label", "일시정지");
      $hero.removeClass("is-paused");
    };

    const start_playback = function () {
      clear_fade_timer();
      clear_autoplay_timer();

      const play_promise = hero_video.play();

      if (play_promise && typeof play_promise.then === "function") {
        play_promise
          .then(function () {
            hero_is_playing = true;
            hero_is_paused = false;
            $hero.addClass("is-playing");
            set_controls_ui(true);
          })
          .catch(function () {
            show_image(true);
            schedule_autoplay();
          });
        return;
      }

      hero_is_playing = true;
      hero_is_paused = false;
      $hero.addClass("is-playing");
      set_controls_ui(true);
    };

    const show_image = function (reset) {
      clear_fade_timer();
      clear_autoplay_timer();

      hero_is_playing = false;
      $hero.removeClass("is-playing");
      hero_video.pause();
      set_controls_ui(false);

      if (!reset) return;

      hero_fade_timer = setTimeout(function () {
        hero_video.currentTime = 0;
        hero_fade_timer = null;
      }, FADE_MS);
    };

    const schedule_autoplay = function () {
      clear_autoplay_timer();
      if (hero_is_paused || hero_is_playing) return;
      if (!is_hero_in_view()) return;

      hero_autoplay_timer = setTimeout(function () {
        hero_autoplay_timer = null;
        if (hero_is_paused || hero_is_playing) return;
        if (!is_hero_in_view()) return;
        play_video();
      }, AUTO_PLAY_DELAY);
    };

    const play_video = function () {
      if (hero_is_paused) return;
      if (!is_hero_in_view()) return;

      hero_video.muted = true;
      sync_mute_ui();
      start_playback();
    };

    const pause_video = function () {
      hero_is_paused = true;
      show_image(false);
    };

    const resume_video = function () {
      if (!hero_is_paused) return;
      if (!is_hero_in_view()) return;
      start_playback();
    };

    const stop_on_scroll = function () {
      clear_autoplay_timer();
      if (!hero_is_playing) return;
      hero_is_paused = false;
      show_image(true);
    };

    $(window).on("scroll.heroVideo", function () {
      if (!is_hero_in_view()) {
        stop_on_scroll();
        return;
      }

      if (!hero_is_playing && !hero_is_paused && !hero_autoplay_timer) {
        schedule_autoplay();
      }
    });

    $hero_play_btn.on("click", function () {
      if (hero_is_playing || hero_is_paused) return;
      play_video();
    });

    $hero_pause_btn.on("click", function () {
      if (hero_is_playing) {
        pause_video();
        return;
      }

      if (hero_is_paused) {
        resume_video();
      }
    });

    $hero_mute_btn.on("click", function () {
      if (!hero_is_playing) return;
      hero_video.muted = !hero_video.muted;
      sync_mute_ui();
    });

    $hero_video.on("ended", function () {
      hero_is_paused = false;
      show_image(true);
      schedule_autoplay();
    });

    set_controls_ui(false);
    sync_mute_ui();
    schedule_autoplay();
  }

  // 드래그스크롤 (임계값 넘을 때만 capture → 클릭과 분리)
  const DRAG_THRESHOLD = 8;

  $(".row__track").each(function (index) {
    const $track = $(this);
    const track = this;
    const ns = ".rowDrag" + index;
    let pointer_id = null;
    let is_dragging = false;
    let block_click = false;
    let start_x = 0;
    let scroll_left = 0;

    const unbind_doc = function () {
      $(document).off(ns);
    };

    const reset_drag = function () {
      pointer_id = null;
      is_dragging = false;
      $track.removeClass("is-dragging");
      unbind_doc();
    };

    const on_pointer_move = function (e) {
      if (pointer_id !== e.originalEvent.pointerId) return;

      const walk = e.clientX - start_x;

      if (!is_dragging) {
        if (Math.abs(walk) < DRAG_THRESHOLD) return;

        is_dragging = true;
        block_click = true;
        $track.addClass("is-dragging");

        try {
          track.setPointerCapture(e.originalEvent.pointerId);
        } catch (err) {}
      }

      e.preventDefault();
      track.scrollLeft = scroll_left - walk;
    };

    const on_pointer_end = function (e) {
      if (pointer_id !== e.originalEvent.pointerId) return;

      if (track.hasPointerCapture && track.hasPointerCapture(e.originalEvent.pointerId)) {
        track.releasePointerCapture(e.originalEvent.pointerId);
      }

      reset_drag();
    };

    $track.on("pointerdown", function (e) {
      if (e.button !== 0) return;
      if (pointer_id !== null) return;

      pointer_id = e.originalEvent.pointerId;
      is_dragging = false;
      block_click = false;
      start_x = e.clientX;
      scroll_left = track.scrollLeft;

      $(document).on("pointermove" + ns, on_pointer_move);
      $(document).on("pointerup" + ns + " pointercancel" + ns, on_pointer_end);
    });

    $track.on("lostpointercapture", function () {
      if (pointer_id === null) return;
      reset_drag();
    });

    track.addEventListener("click", function (e) {
      if (!block_click) return;
      e.preventDefault();
      e.stopPropagation();
      block_click = false;
    }, true);

    $track.find("img, a").attr("draggable", "false");
  });

  // 모바일/태블릿 햄버거 메뉴
  const $menu_toggle = $("[data-menu-toggle]");
  const $header_nav = $("[data-header-nav]");
  const $menu_icon = $("[data-menu-icon]");
  const $profile_wrap = $(".header__profile-wrap");
  const $profile_toggle = $("[data-profile-toggle]");
  const $profile_dropdown = $("[data-profile-dropdown]");

  const close_profile_dropdown = function () {
    if (!$profile_wrap.length) return;
    $profile_wrap.removeClass("is-open");
    $profile_toggle.attr("aria-expanded", "false");
  };

  const close_menu = function () {
    if (!$header_nav.length) return;
    $header_nav.removeClass("is-open");
    $menu_toggle.attr("aria-expanded", "false").attr("aria-label", "메뉴 열기");
    if ($menu_icon.length) $menu_icon.text("menu");
  };

  if ($menu_toggle.length && $header_nav.length) {
    const open_menu = function () {
      close_profile_dropdown();
      $header_nav.addClass("is-open");
      $menu_toggle.attr("aria-expanded", "true").attr("aria-label", "메뉴 닫기");
      if ($menu_icon.length) $menu_icon.text("close");
    };

    $menu_toggle.on("click", function (e) {
      e.stopPropagation();
      if ($header_nav.hasClass("is-open")) {
        close_menu();
      } else {
        open_menu();
      }
    });

    $header_nav.on("click", function (e) {
      e.stopPropagation();
    });

    $header_nav.find(".header__link").on("click", function () {
      close_menu();
    });

    $(document).on("click.headerMenu", function () {
      close_menu();
    });

    $(document).on("keydown.headerMenu", function (e) {
      if (e.key === "Escape") close_menu();
    });

    $(window).on("resize.headerMenu", function () {
      if (window.innerWidth > 1024) close_menu();
    });
  }

  // 프로필 드롭다운
  if ($profile_wrap.length && $profile_toggle.length && $profile_dropdown.length) {
    const open_dropdown = function () {
      close_menu();
      $profile_wrap.addClass("is-open");
      $profile_toggle.attr("aria-expanded", "true");
    };

    $profile_toggle.on("click", function (e) {
      e.stopPropagation();
      if ($profile_wrap.hasClass("is-open")) {
        close_profile_dropdown();
      } else {
        open_dropdown();
      }
    });

    $profile_dropdown.on("click", function (e) {
      e.stopPropagation();
    });

    $(document).on("click", function () {
      close_profile_dropdown();
    });

    $(document).on("keydown", function (e) {
      if (e.key === "Escape") close_profile_dropdown();
    });

    $("[data-logout]").on("click", function () {
      close_profile_dropdown();
      alert("로그아웃 기능 미구현");
    });
  }

  // 상세정보 모달
  const $detail = $("[data-detail]");
  const $detail_hero = $detail.find(".detail__hero");
  const $detail_video = $detail.find(".detail__hero-video");
  const $detail_play_btn = $detail.find("[data-detail-play]");
  const $detail_mute_btn = $detail.find("[data-detail-mute]");
  const detail_video = $detail_video.get(0);
  const DETAIL_AUTO_PLAY_DELAY = 2000;
  let detail_fade_timer = null;
  let detail_autoplay_timer = null;
  let detail_is_playing = false;
  let detail_is_paused = false;
  let content_map = {};
  let default_detail = null;

  if ($detail.length) {
    const $detail_mute_icon = $detail_mute_btn.find(".material-symbols-outlined");
    const $detail_backdrop = $detail.find("[data-detail-backdrop]");
    const $detail_title = $detail.find("[data-detail-title]");
    const $detail_meta_row = $detail.find("[data-detail-meta-row]");
    const $detail_rating = $detail.find("[data-detail-rating]");
    const $detail_desc = $detail.find("[data-detail-desc]");
    const $detail_meta_side = $detail.find("[data-detail-meta-side]");
    const $detail_episodes = $detail.find("[data-detail-episodes]");

    const clear_detail_fade_timer = function () {
      if (!detail_fade_timer) return;
      clearTimeout(detail_fade_timer);
      detail_fade_timer = null;
    };

    const clear_detail_autoplay_timer = function () {
      if (!detail_autoplay_timer) return;
      clearTimeout(detail_autoplay_timer);
      detail_autoplay_timer = null;
    };

    const sync_detail_mute_ui = function () {
      if (!detail_video) return;

      if (detail_video.muted) {
        $detail_mute_icon.text("volume_off");
        $detail_mute_btn.attr("aria-label", "소리 켜기");
      } else {
        $detail_mute_icon.text("volume_up");
        $detail_mute_btn.attr("aria-label", "음소거");
      }
    };

    const start_detail_playback = function () {
      if (!detail_video) return;

      clear_detail_fade_timer();
      clear_detail_autoplay_timer();

      const play_promise = detail_video.play();

      if (play_promise && typeof play_promise.then === "function") {
        play_promise
          .then(function () {
            detail_is_playing = true;
            detail_is_paused = false;
            $detail_hero.addClass("is-playing");
          })
          .catch(function () {
            show_detail_image(true);
          });
        return;
      }

      detail_is_playing = true;
      detail_is_paused = false;
      $detail_hero.addClass("is-playing");
    };

    const show_detail_image = function (reset) {
      if (!detail_video) return;

      clear_detail_fade_timer();
      clear_detail_autoplay_timer();

      detail_is_playing = false;
      $detail_hero.removeClass("is-playing");
      detail_video.pause();

      if (!reset) return;

      detail_fade_timer = setTimeout(function () {
        detail_video.currentTime = 0;
        detail_fade_timer = null;
      }, FADE_MS);
    };

    const play_detail_video = function () {
      if (!detail_video) return;
      if (detail_is_paused) return;

      detail_video.muted = true;
      sync_detail_mute_ui();
      start_detail_playback();
    };

    const pause_detail_video = function () {
      detail_is_paused = true;
      show_detail_image(false);
    };

    const resume_detail_video = function () {
      if (!detail_is_paused) return;
      start_detail_playback();
    };

    const schedule_detail_autoplay = function () {
      clear_detail_autoplay_timer();
      if (!detail_video) return;
      if (detail_is_paused || detail_is_playing) return;

      detail_autoplay_timer = setTimeout(function () {
        detail_autoplay_timer = null;
        if (!$detail.hasClass("is-open")) return;
        if (detail_is_paused || detail_is_playing) return;
        play_detail_video();
      }, DETAIL_AUTO_PLAY_DELAY);
    };

    const stop_detail_video = function () {
      detail_is_paused = false;
      show_detail_image(true);
      sync_detail_mute_ui();
    };

    const merge_detail = function (item) {
      return $.extend({}, default_detail || {}, item || {});
    };

    const set_detail_video_src = function (src) {
      if (!detail_video || !src) return;

      const $source = $detail_video.find("source");
      if ($source.length) {
        $source.attr("src", src);
      } else {
        $detail_video.attr("src", src);
      }

      detail_video.load();
    };

    const fill_detail = function (item) {
      const data = merge_detail(item);
      const title = data.title || "";

      $detail_backdrop.attr("src", data.backdrop || "").attr("alt", title + " 상세 배경");
      set_detail_video_src(data.video || "");

      if (data.logo) {
        $detail_title.html(
          $("<img>", { src: data.logo, alt: title })
        );
      } else {
        $detail_title.text(title);
      }

      $detail_meta_row.empty();
      if (data.year) $detail_meta_row.append($("<span>").text(data.year));
      if (data.episode_count) $detail_meta_row.append($("<span>").text(data.episode_count));
      if (data.badge) {
        $detail_meta_row.append($("<span>", { class: "detail__badge" }).text(data.badge));
      }

      $detail_rating.text(data.rating || "");
      $detail_desc.html(data.description || "");

      $detail_meta_side.empty();
      if (data.cast) {
        $detail_meta_side.append(
          $("<p>").append($("<span>", { class: "detail__label" }).text("출연: "), document.createTextNode(data.cast))
        );
      }
      if (data.genre) {
        $detail_meta_side.append(
          $("<p>").append($("<span>", { class: "detail__label" }).text("장르: "), document.createTextNode(data.genre))
        );
      }
      if (data.features) {
        $detail_meta_side.append(
          $("<p>").append($("<span>", { class: "detail__label" }).text("시리즈 특징: "), document.createTextNode(data.features))
        );
      }

      $detail_episodes.empty();
      const episodes = data.episodes || [];
      for (let i = 0; i < episodes.length; i++) {
        const ep = episodes[i];
        if (!ep) continue;

        const $li = $("<li>", { class: "detail__episode" });
        $li.append($("<span>", { class: "detail__episode-num" }).text(ep.num));

        const $thumb = $("<div>", { class: "detail__episode-thumb" });
        $thumb.append(
          $("<img>", { src: ep.image || "", alt: (ep.name || "") + " 썸네일", draggable: false })
        );
        $thumb.append(
          $("<span>", { class: "detail__episode-play", "aria-hidden": "true" }).append(
            $("<span>", { class: "material-symbols-outlined" }).text("play_arrow")
          )
        );
        $li.append($thumb);

        const $info = $("<div>", { class: "detail__episode-info" });
        const $top = $("<div>", { class: "detail__episode-top" });
        $top.append($("<span>", { class: "detail__episode-name" }).text(ep.name || ""));
        $top.append($("<span>", { class: "detail__episode-runtime" }).text(ep.runtime || ""));
        $info.append($top);
        $info.append($("<p>", { class: "detail__episode-desc" }).text(ep.description || ""));
        $li.append($info);

        $detail_episodes.append($li);
      }
    };

    const open_detail = function (item) {
      stop_detail_video();
      fill_detail(item);
      $detail.addClass("is-open");
      $("body").addClass("detail-open");
      schedule_detail_autoplay();
    };

    const close_detail = function () {
      stop_detail_video();
      $detail.removeClass("is-open");
      $("body").removeClass("detail-open");
    };

    $("[data-open-detail]").on("click", function () {
      open_detail(default_detail);
    });

    $("[data-close-detail]").on("click", function () {
      close_detail();
    });

    $(document).on("click", "[data-card-id]", function (e) {
      e.preventDefault();

      const id = $(this).attr("data-card-id");
      if (!id || !content_map[id]) return;

      open_detail(content_map[id]);
    });

    $detail_play_btn.on("click", function (e) {
      e.stopPropagation();

      if (detail_is_playing) return;

      if (detail_is_paused) {
        resume_detail_video();
        return;
      }

      play_detail_video();
    });

    $detail_hero.on("click", function (e) {
      if (!detail_is_playing) return;
      if ($(e.target).closest("button, a, .detail__actions").length) return;
      pause_detail_video();
    });

    $detail_mute_btn.on("click", function (e) {
      e.stopPropagation();
      if (!detail_video || !detail_is_playing) return;
      detail_video.muted = !detail_video.muted;
      sync_detail_mute_ui();
    });

    $detail_video.on("ended", function () {
      detail_is_paused = false;
      show_detail_image(true);
    });

    sync_detail_mute_ui();

    $(document).on("keydown", function (e) {
      if (e.key === "Escape" && $detail.hasClass("is-open")) {
        close_detail();
      }
    });

    // 카드 데이터 로드 / 렌더
    const escape_html = function (str) {
      return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
    };

    const RANK_BASE =
      "https://cdn.jsdelivr.net/gh/d3vKJ/portfolio_assets@main/netflix/ranks/";

    const create_top10_html = function (item) {
      if (!item || !item.id || !item.image) return "";

      const rank = Number(item.rank) || 0;
      const title = escape_html(item.title || "");
      const image = escape_html(item.image);
      const id = escape_html(item.id);
      const num_class =
        rank === 10 ? "top10-card__num top10-card__num--10" : "top10-card__num";

      return (
        '<article class="top10-card">' +
        '<span class="' +
        num_class +
        '" aria-hidden="true">' +
        '<img src="' +
        RANK_BASE +
        rank +
        '.svg" alt="' +
        rank +
        '위" draggable="false">' +
        "</span>" +
        '<a href="#" class="top10-card__poster" data-card-id="' +
        id +
        '">' +
        '<img src="' +
        image +
        '" alt="' +
        title +
        '" draggable="false">' +
        "</a>" +
        "</article>"
      );
    };

    const create_card_html = function (item, type) {
      if (!item || !item.id || !item.image) return "";

      if (type === "top10") return create_top10_html(item);

      const title = escape_html(item.title || "");
      const image = escape_html(item.image);
      const id = escape_html(item.id);
      let extra = "";
      let card_class = "card";

      if (type === "continue") {
        card_class += " card--progress";
        if (item.label) {
          extra += '<span class="card__label">' + escape_html(item.label) + "</span>";
        }
        const progress = Math.max(0, Math.min(100, Number(item.progress) || 0));
        extra +=
          '<span class="card__progress"><span class="card__progress-bar" style="width: ' +
          progress +
          '%"></span></span>';
      }

      if (type === "genre") {
        card_class += " card--genre";
        if (item.genre_label) {
          extra += '<span class="card__genre">' + escape_html(item.genre_label) + "</span>";
        }
      }

      return (
        '<article class="' +
        card_class +
        '">' +
        '<a href="#" class="card__link" data-card-id="' +
        id +
        '">' +
        '<img src="' +
        image +
        '" alt="' +
        title +
        '" class="card__img" draggable="false">' +
        extra +
        "</a>" +
        "</article>"
      );
    };

    const render_rows = function (data) {
      if (!data) return;

      default_detail = data.default_detail || null;
      content_map = {};

      const row_keys = ["top10", "continue", "mylist", "ai", "new", "genre"];

      for (let i = 0; i < row_keys.length; i++) {
        const key = row_keys[i];
        const list = data[key];
        const $track = $('[data-row="' + key + '"]');

        if (!$track.length || !Array.isArray(list)) continue;

        let html = "";

        for (let j = 0; j < list.length; j++) {
          const item = list[j];
          if (!item || !item.id) continue;

          content_map[item.id] = item;
          html += create_card_html(item, key);
        }

        $track.html(html);
        $track.find("img, a").attr("draggable", "false");
      }
    };

    $.getJSON("js/data.json")
      .done(function (data) {
        render_rows(data);
      })
      .fail(function () {
        console.error("카드 데이터를 불러오지 못했습니다.");
      });
  }
});
