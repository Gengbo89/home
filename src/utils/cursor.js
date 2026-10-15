// 自定义鼠标：一个跟随指针的白色圆点
// 说明：
// 1. 原先用 document.onmousemove 等全局赋值，会覆盖别的处理器且无法卸载，这里改为 addEventListener，
//    并返回带 destroy() 的实例，交由调用方在卸载时清理。
// 2. 原先会遍历页面上所有元素读取 computedStyle 并保存 outerHTML（扫描结果 pt 从未被使用），
//    既触发整页样式重算又占用内存，这里去掉，改为用一条 CSS 规则给可点击元素保留 pointer 光标，
//    避免 * { cursor: ... !important } 把可点击元素的鼠标反馈一起抹掉。
const CURSOR_ID = "cursor";
const CURSOR_OFFSET = 8;

const lerp = (a, b, n) => {
  if (Math.round(a) === b) {
    return b;
  }
  return (1 - n) * a + n * b;
};

class Cursor {
  constructor() {
    this.pos = {
      curr: null,
      prev: null,
    };
    this.destroyed = false;
    this.create();
    this.init();
    this.render();
  }

  move(left, top) {
    this.cursor.style["left"] = `${left}px`;
    this.cursor.style["top"] = `${top}px`;
  }

  create() {
    if (!this.cursor) {
      this.cursor = document.createElement("div");
      this.cursor.id = CURSOR_ID;
      this.cursor.classList.add("hidden");
      document.body.append(this.cursor);
    }

    this.scr = document.createElement("style");
    this.scr.innerHTML = `
      * { cursor: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' width='10px' height='10px'><circle cx='4' cy='4' r='4' fill='white' /></svg>") 4 4, auto !important }
      a, button, [role="button"], summary, label, select, input, textarea, .cards { cursor: pointer !important }
    `;
    document.body.appendChild(this.scr);
  }

  init() {
    this.onMouseMove = (e) => {
      this.pos.curr === null && this.move(e.clientX - CURSOR_OFFSET, e.clientY - CURSOR_OFFSET);
      this.pos.curr = {
        x: e.clientX - CURSOR_OFFSET,
        y: e.clientY - CURSOR_OFFSET,
      };
      this.cursor.classList.remove("hidden");
      this.render();
    };
    this.onMouseEnter = () => this.cursor.classList.remove("hidden");
    this.onMouseLeave = () => this.cursor.classList.add("hidden");
    this.onMouseDown = () => this.cursor.classList.add("active");
    this.onMouseUp = () => this.cursor.classList.remove("active");

    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("mouseenter", this.onMouseEnter);
    document.addEventListener("mouseleave", this.onMouseLeave);
    document.addEventListener("mousedown", this.onMouseDown);
    document.addEventListener("mouseup", this.onMouseUp);
  }

  render() {
    // 还没收到过 mousemove 时没有可渲染的位置，直接返回（下一次 mousemove 会再次触发）
    if (this.destroyed || !this.pos.curr) return;
    if (this.pos.prev) {
      this.pos.prev.x = lerp(this.pos.prev.x, this.pos.curr.x, 0.35);
      this.pos.prev.y = lerp(this.pos.prev.y, this.pos.curr.y, 0.35);
      this.move(this.pos.prev.x, this.pos.prev.y);
    } else {
      this.pos.prev = this.pos.curr;
    }
    if (this.pos.curr.x !== this.pos.prev.x || this.pos.curr.y !== this.pos.prev.y) {
      this.raf = requestAnimationFrame(() => this.render());
    }
  }

  // 卸载：移除监听、注入的样式和光标元素
  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("mouseenter", this.onMouseEnter);
    document.removeEventListener("mouseleave", this.onMouseLeave);
    document.removeEventListener("mousedown", this.onMouseDown);
    document.removeEventListener("mouseup", this.onMouseUp);
    this.scr?.remove();
    this.cursor?.remove();
    this.cursor = null;
    this.scr = null;
  }
}

const cursorInit = () => new Cursor();

export default cursorInit;