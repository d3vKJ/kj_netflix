(function () {
  const header = document.querySelector(".header");
  const back_top = document.getElementById("backTop");

  if (header && back_top) {
    const on_scroll = function () {
      const y = window.scrollY;

      if (y > 40) {
        header.classList.add("header--scrolled");
      } else {
        header.classList.remove("header--scrolled");
      }

      if (y > 400) {
        back_top.classList.add("is-visible");
      } else {
        back_top.classList.remove("is-visible");
      }
    };

    window.addEventListener("scroll", on_scroll, { passive: true });
    on_scroll();

    back_top.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // 가로 행 드래그 스크롤
  const DRAG_THRESHOLD = 8;
  const tracks = document.querySelectorAll(".row__track");

  tracks.forEach(function (track) {
    if (!track) return;

    let pointer_id = null;
    let is_dragging = false;
    let block_click = false;
    let start_x = 0;
    let scroll_left = 0;

    const reset_drag = function () {
      pointer_id = null;
      is_dragging = false;
      track.classList.remove("is-dragging");
    };

    track.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      if (pointer_id !== null) return;

      pointer_id = e.pointerId;
      is_dragging = false;
      block_click = false;
      start_x = e.clientX;
      scroll_left = track.scrollLeft;

      track.setPointerCapture(e.pointerId);
    });

    track.addEventListener("pointermove", function (e) {
      if (pointer_id !== e.pointerId) return;

      const walk = e.clientX - start_x;

      if (!is_dragging) {
        if (Math.abs(walk) < DRAG_THRESHOLD) return;
        is_dragging = true;
        block_click = true;
        track.classList.add("is-dragging");
      }

      e.preventDefault();
      track.scrollLeft = scroll_left - walk;
    });

    const on_pointer_end = function (e) {
      if (pointer_id !== e.pointerId) return;

      if (track.hasPointerCapture(e.pointerId)) {
        track.releasePointerCapture(e.pointerId);
      }

      reset_drag();
    };

    track.addEventListener("pointerup", on_pointer_end);
    track.addEventListener("pointercancel", on_pointer_end);
    track.addEventListener("lostpointercapture", function () {
      reset_drag();
    });

    track.addEventListener("click", function (e) {
      if (!block_click) return;
      e.preventDefault();
      e.stopPropagation();
      block_click = false;
    }, true);

    track.querySelectorAll("img, a").forEach(function (el) {
      el.setAttribute("draggable", "false");
    });
  });
})();