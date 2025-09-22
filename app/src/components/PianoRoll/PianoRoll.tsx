import styled from "@emotion/styled"
import useComponentSize from "@rehooks/component-size"
import { clamp } from "lodash"
import { FC, useCallback, useEffect, useRef } from "react"
import { Layout, WHEEL_SCROLL_RATE } from "../../Constants"
import { isTouchPadEvent } from "../../helpers/touchpad"
import { useKeyScroll } from "../../hooks/useKeyScroll"
import { usePianoNotesKeyboardShortcut } from "../../hooks/usePianoNotesKeyboardShortcut"
import { usePianoRoll } from "../../hooks/usePianoRoll"
import { useTickScroll } from "../../hooks/useTickScroll"
import { useTrack } from "../../hooks/useTrack"
import ControlPane from "../ControlPane/ControlPane"
import {
  HorizontalScaleScrollBar,
  VerticalScaleScrollBar,
} from "../inputs/ScaleScrollBar"
import { PianoRollStage } from "./PianoRollStage"
import { StyledSplitPane } from "./StyledSplitPane"

const Parent = styled.div`
  flex-grow: 1;
  background: var(--color-background);
  position: relative;
`

const Alpha = styled.div`
  flex-grow: 1;
  position: relative;
  outline: none;
`

const Beta = styled.div`
  border-top: 1px solid var(--color-divider);
  height: calc(100% - 17px);
`

const PianoRollWrapper: FC = () => {
  const { transform, scrollBy, selectedTrackId, setActivePane } = usePianoRoll()
  const { isRhythmTrack } = useTrack(selectedTrackId)
  const {
    contentHeight,
    scrollTop,
    scaleAroundPointY,
    setScrollTopInPixels,
    setScaleY,
  } = useKeyScroll()
  const {
    scrollLeft,
    contentWidth,
    scaleAroundPointX,
    setAutoScroll,
    setScrollLeftInPixels,
    setScaleX,
  } = useTickScroll()
  const keyboardShortcutProps = usePianoNotesKeyboardShortcut()

  const ref = useRef(null)
  const size = useComponentSize(ref)

  const alphaRef = useRef<HTMLDivElement>(null)
  const { height: alphaHeight = 0 } = useComponentSize(alphaRef)
  const keyWidth = isRhythmTrack
    ? Layout.keyWidth + Layout.drumKeysWidth
    : Layout.keyWidth

  const onClickScaleUpHorizontal = useCallback(
    () => scaleAroundPointX(0.2, 0),
    [scaleAroundPointX],
  )
  const onClickScaleDownHorizontal = useCallback(
    () => scaleAroundPointX(-0.2, 0),
    [scaleAroundPointX],
  )
  const onClickScaleResetHorizontal = useCallback(
    () => setScaleX(1),
    [setScaleX],
  )

  const onClickScaleUpVertical = useCallback(
    () => scaleAroundPointY(0.2, 0),
    [scaleAroundPointY],
  )
  const onClickScaleDownVertical = useCallback(
    () => scaleAroundPointY(-0.2, 0),
    [scaleAroundPointY],
  )
  const onClickScaleResetVertical = useCallback(() => setScaleY(1), [setScaleY])

  const onWheel = useCallback(
    (e: WheelEvent) => {
      // Prevent browser back/forward navigation on horizontal touchpad scrolling
      e.preventDefault()
      e.stopPropagation()
      
      if (e.shiftKey && (e.altKey || e.ctrlKey)) {
        // vertical zoom
        let scaleYDelta = isTouchPadEvent(e)
          ? 0.02 * e.deltaY
          : 0.01 * e.deltaX
        scaleYDelta = clamp(scaleYDelta, -0.15, 0.15) // prevent acceleration to zoom too fast
        scaleAroundPointY(scaleYDelta, e.offsetY)
      } else if (e.altKey || e.ctrlKey) {
        // horizontal zoom
        const scaleFactor = isTouchPadEvent(e) ? 0.01 : -0.01
        const scaleXDelta = clamp(e.deltaY * scaleFactor, -0.15, 0.15) // prevent acceleration to zoom too fast
        scaleAroundPointX(scaleXDelta, e.offsetX)
      } else {
        // scrolling
        const scaleFactor = isTouchPadEvent(e)
          ? 1
          : transform.pixelsPerKey * WHEEL_SCROLL_RATE
        const deltaY = e.deltaY * scaleFactor
        scrollBy(-e.deltaX, -deltaY)
      }
    },
    [scrollBy, transform, scaleAroundPointX, scaleAroundPointY],
  )

  const onChangeSplitPane = useCallback(() => {
    setScrollTopInPixels(scrollTop)
  }, [setScrollTopInPixels, scrollTop])

  const onFocusNotes = useCallback(
    () => setActivePane("notes"),
    [setActivePane],
  )

  const onBlurNotes = useCallback(() => setActivePane(null), [setActivePane])

  useEffect(
    () => () => {
      setActivePane(null)
    },
    [setActivePane],
  )

  // Add native wheel event listener to prevent passive event issues
  useEffect(() => {
    const alphaElement = alphaRef.current
    if (!alphaElement) return

    alphaElement.addEventListener("wheel", onWheel, { passive: false })

    return () => {
      alphaElement.removeEventListener("wheel", onWheel)
    }
  }, [onWheel])

  return (
    <Parent ref={ref}>
      <StyledSplitPane
        split="horizontal"
        minSize={50}
        defaultSize={"60%"}
        onChange={onChangeSplitPane}
      >
        <Alpha
          ref={alphaRef}
          {...keyboardShortcutProps}
          onFocus={onFocusNotes}
          onBlur={onBlurNotes}
          tabIndex={0}
        >
          <PianoRollStage
            width={size.width}
            height={alphaHeight}
            keyWidth={keyWidth}
          />
          <VerticalScaleScrollBar
            scrollOffset={scrollTop}
            contentLength={contentHeight}
            onScroll={setScrollTopInPixels}
            onClickScaleUp={onClickScaleUpVertical}
            onClickScaleDown={onClickScaleDownVertical}
            onClickScaleReset={onClickScaleResetVertical}
          />
        </Alpha>
        <Beta>
          <ControlPane axisWidth={keyWidth} />
        </Beta>
      </StyledSplitPane>
      <HorizontalScaleScrollBar
        scrollOffset={scrollLeft}
        contentLength={contentWidth}
        onScroll={useCallback(
          (v: number) => {
            setScrollLeftInPixels(v)
            setAutoScroll(false)
          },
          [setScrollLeftInPixels, setAutoScroll],
        )}
        onClickScaleUp={onClickScaleUpHorizontal}
        onClickScaleDown={onClickScaleDownHorizontal}
        onClickScaleReset={onClickScaleResetHorizontal}
      />
    </Parent>
  )
}

export default PianoRollWrapper
