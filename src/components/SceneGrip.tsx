export function SceneGrip() {
  return (
    <button
      type="button"
      data-scene-grab
      className="scene-grip"
      title="拖曳以旋轉立體場景，Shift 拖曳平移，滾輪縮放；雙擊或按 0 重設"
      aria-label="操控場景：拖曳旋轉立體介面，雙擊重設"
    >
      <span className="scene-grip-reticle" aria-hidden="true" />
      <span className="font-hud tracking-[0.22em]">操控場景</span>
    </button>
  );
}
