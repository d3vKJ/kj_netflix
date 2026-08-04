$(function () {
  const $header = $(".header");
  const $back_top = $("#backTop");

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

  // 드래그스크롤
  const DRAG_THRESHOLD = 8;

  $(".row__track").each(function () {
    const $track = $(this);
    const track = this;
    let pointer_id = null;
    let is_dragging = false;
    let block_click = false;
    let start_x = 0;
    let scroll_left = 0;

    const reset_drag = function () {
      pointer_id = null;
      is_dragging = false;
      $track.removeClass("is-dragging");
    };

    $track.on("pointerdown", function (e) {
      if (e.button !== 0) return;
      if (pointer_id !== null) return;

      pointer_id = e.originalEvent.pointerId;
      is_dragging = false;
      block_click = false;
      start_x = e.clientX;
      scroll_left = track.scrollLeft;

      track.setPointerCapture(e.originalEvent.pointerId);
    });

    $track.on("pointermove", function (e) {
      if (pointer_id !== e.originalEvent.pointerId) return;

      const walk = e.clientX - start_x;

      if (!is_dragging) {
        if (Math.abs(walk) < DRAG_THRESHOLD) return;
        is_dragging = true;
        block_click = true;
        $track.addClass("is-dragging");
      }

      e.preventDefault();
      track.scrollLeft = scroll_left - walk;
    });

    const on_pointer_end = function (e) {
      if (pointer_id !== e.originalEvent.pointerId) return;

      if (track.hasPointerCapture(e.originalEvent.pointerId)) {
        track.releasePointerCapture(e.originalEvent.pointerId);
      }

      reset_drag();
    };

    $track.on("pointerup pointercancel", on_pointer_end);
    $track.on("lostpointercapture", reset_drag);

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

  if ($detail.length) {
    const open_detail = function () {
      $detail.addClass("is-open");
      $("body").addClass("detail-open");
    };

    const close_detail = function () {
      $detail.removeClass("is-open");
      $("body").removeClass("detail-open");
    };

    $("[data-open-detail]").on("click", function () {
      open_detail();
    });

    $("[data-close-detail]").on("click", function () {
      close_detail();
    });

    $(document).on("keydown", function (e) {
      if (e.key === "Escape" && $detail.hasClass("is-open")) {
        close_detail();
      }
    });
  }
});
