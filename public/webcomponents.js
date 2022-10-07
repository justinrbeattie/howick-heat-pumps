class TextContent extends HTMLDivElement {
    resizeObserver;
    constructor() {
      super();

      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          this.adjustGridRows();
        }
      });
      this.resizeObserver.observe(this);
    }

    connectedCallback() {
        this.adjustGridRows();
      }
    disconnectedCallback() {
      this.resizeObserver.disconnect();
    }
    adjustGridRows() {
      this.parentElement.style.setProperty(
        "--grid-span", Math.ceil(this.offsetHeight / (window.innerHeight / 10))
      );
    }
  }
  customElements.define("text-content", TextContent, {
    extends: "div"
  });