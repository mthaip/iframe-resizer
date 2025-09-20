import connectResizer, {
  IFrameComponent,
  ResizerEvents,
  ResizerOptions,
} from '@iframe-resizer/core'
import acg from 'auto-console-group'
import React, { useEffect, useImperativeHandle, useRef } from 'react'

import filterIframeAttribs from '../common/filter-iframe-attribs'
import { esModuleInterop } from '../common/utils'

// Deal with UMD not converting default exports to named exports
const createAutoConsoleGroup = esModuleInterop(acg)

type IframeProps = React.DetailedHTMLProps<
  React.IframeHTMLAttributes<HTMLIFrameElement>,
  HTMLIFrameElement
>

type IframeResizerProps = Omit<IframeProps, 'scrolling'> &
  ResizerOptions &
  ResizerEvents & {
    forwardRef?: any
    id?: string
  }

// TODO: Add support for React.forwardRef() in next major version (Breaking change)
function IframeResizer(props: IframeResizerProps) {
  // eslint-disable-next-line react/prop-types
  const { forwardRef, ...rest } = props
  const filteredProps = filterIframeAttribs(rest)
  const iframeRef = useRef<IFrameComponent>(null)
  const consoleGroup = createAutoConsoleGroup()

  const onBeforeClose = () => {
    consoleGroup.event('Blocked Close Event')
    consoleGroup.warn(
      `Close event ignored, to remove the iframe update your React component.`,
    )

    return false
  }

  // This hook is only run once, as once iframe-resizer is bound, it will
  // deal with changes to the element and does not need recalling
  useEffect(() => {
    const iframe = iframeRef.current

    if (!iframe) return

    const resizerOptions = { ...rest, onBeforeClose }

    consoleGroup.label(`react(${iframe.id})`)
    consoleGroup.event('setup')

    const resizer = connectResizer(resizerOptions)(iframe)

    consoleGroup.expand(resizerOptions.logExpand)
    if (rest.log) consoleGroup.log('Created React component')

    return () => {
      consoleGroup.endAutoGroup()
      resizer?.disconnect()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useImperativeHandle(forwardRef, () => ({
    getRef: () => iframeRef,
    getElement: () => iframeRef.current,
    resize: () => iframeRef.current?.iFrameResizer.resize(),
    moveToAnchor: (anchor: string) =>
      iframeRef.current?.iFrameResizer.moveToAnchor(anchor),
    sendMessage: (message: any, targetOrigin?: string) => {
      iframeRef.current?.iFrameResizer.sendMessage(message, targetOrigin)
    },
  }))

  // eslint-disable-next-line jsx-a11y/iframe-has-title
  return <iframe {...filteredProps} ref={iframeRef} />
}

export default IframeResizer
