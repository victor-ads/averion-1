$(document).ready(function () {
  (function () {
    const $inputs = $('#otp-input .otp-box');

    if (!$inputs.length) return;

    function firstEmptyIndex() {
      let idx = -1;
      $inputs.each(function (i) {
        if (!$(this).val()) {
          idx = i;
          return false;
        }
      });
      return idx;
    }

    function lastFilledIndex() {
      let idx = -1;
      $inputs.each(function (i) {
        if ($(this).val()) idx = i;
      });
      return idx;
    }

    function focusFirstIfVisible() {
      const $wrap = $('#otp-input');
      if ($wrap.length && $wrap.is(':visible')) {
        $inputs.first().focus();
      }
    }

    // initial focus (if visible)
    focusFirstIfVisible();

    // also try to focus when a step is shown (script.js triggers 'showStep' on steps)
    $(document).on('showStep', '.auth-step', function () {
      focusFirstIfVisible();
    });

    // When trying to focus any box, enforce sequential behavior:
    // - If there are filled boxes to the right, redirect focus to the rightmost filled box.
    // - If any previous box is empty, move focus to the first empty previous box.
    $inputs.on('focus', function () {
      const idx = $inputs.index(this);
      const lastFilled = lastFilledIndex();

      if (lastFilled > idx) {
        // user attempted to focus an earlier box while later boxes are filled; redirect to rightmost filled
        $inputs.eq(lastFilled).focus();
        return;
      }

      if (idx > 0) {
        for (let i = 0; i < idx; i++) {
          if (!$inputs.eq(i).val()) {
            $inputs.eq(i).focus();
            return;
          }
        }
      }
    });

    // Input handler: reject input if any box to the right is already filled.
    $inputs.on('input', function () {
      const $this = $(this);
      const idx = $inputs.index(this);
      const lastFilled = lastFilledIndex();

      // If any box to the right is filled, disallow editing this box — redirect to rightmost filled
      if (lastFilled > idx) {
        $this.val(''); // undo attempted entry
        $inputs.eq(lastFilled).focus();
        return;
      }

      const val = $this.val().replace(/\D/g, '');
      $this.val(val);
      if (val) $this.addClass('active');
      else $this.removeClass('active');

      // Advance to next sequential input
      if (val && idx < $inputs.length - 1) {
        $inputs.eq(idx + 1).focus();
      }
    });

    // Keydown: implement reverse-sequential backspace and arrow nav
    $inputs.on('keydown', function (e) {
      const $this = $(this);
      const idx = $inputs.index(this);
      const lastFilled = lastFilledIndex();

      if (e.key === 'Backspace') {
        // If there are filled boxes to the right, clear the rightmost filled first
        if (lastFilled > idx) {
          const $target = $inputs.eq(lastFilled);
          $target.val('').removeClass('active').focus();
          e.preventDefault();
          return;
        }

        // If current has a value, clear it
        if ($this.val()) {
          $this.val('').removeClass('active');
          e.preventDefault();
          return;
        }

        // If current empty, move back and clear previous
        if (!$this.val() && idx > 0) {
          const $prev = $inputs.eq(idx - 1);
          $prev.val('').removeClass('active').focus();
          e.preventDefault();
          return;
        }
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        $inputs.eq(idx - 1).focus();
        e.preventDefault();
      } else if (e.key === 'ArrowRight' && idx < $inputs.length - 1) {
        // allow moving right only if previous inputs are filled
        for (let i = 0; i < idx + 1; i++) {
          if (!$inputs.eq(i).val()) {
            $inputs.eq(i).focus();
            e.preventDefault();
            return;
          }
        }
        $inputs.eq(idx + 1).focus();
        e.preventDefault();
      }
    });

    // Paste: only allow paste if previous boxes are filled and no later boxes are filled
    $inputs.on('paste', function (e) {
      e.preventDefault();
      const clipboard =
        (e.originalEvent || e).clipboardData.getData('text') || '';
      const digits = clipboard.replace(/\D/g, '');
      if (!digits) return;

      const startIdx = $inputs.index(this);
      const lastFilled = lastFilledIndex();

      // If there are filled boxes to the right, redirect to the rightmost filled
      if (lastFilled > startIdx) {
        $inputs.eq(lastFilled).focus();
        return;
      }

      // Ensure previous boxes are filled
      for (let i = 0; i < startIdx; i++) {
        if (!$inputs.eq(i).val()) {
          $inputs.eq(i).focus();
          return;
        }
      }

      let pos = startIdx;
      for (const ch of digits) {
        if (pos >= $inputs.length) break;
        $inputs.eq(pos).val(ch).addClass('active');
        pos++;
      }

      const nextEmpty = firstEmptyIndex();
      if (nextEmpty === -1) $inputs.last().focus();
      else $inputs.eq(nextEmpty).focus();
    });
  })();
});
