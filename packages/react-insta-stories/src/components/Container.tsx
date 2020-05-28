import React, { useContext, useState, useRef, useEffect } from 'react'
import GlobalContext from './../context/Global'
import ProgressContext from './../context/Progress'
import Story from './Story'
import ProgressArray from './ProgressArray'
import { GlobalCtx } from './../interfaces'
// @ts-ignore
import {useSwipeable} from "react-swipeable";

export default function () {
    const [currentId, setCurrentId] = useState<number>(0)
    const [pause, setPause] = useState<boolean>(true)
    const [bufferAction, setBufferAction] = useState<boolean>(true)
    const [videoDuration, setVideoDuration] = useState<number>(0)

    let mousedownId = useRef<NodeJS.Timeout>()

    const { width, height, stories, loop, currentIndex, isPaused, autoStoryChange } = useContext<GlobalCtx>(GlobalContext)
    const {beforePrevStory, beforeNextStory} = useContext<GlobalCtx>(GlobalContext)

    useEffect(() => {
        if (typeof currentIndex === 'number') {
            if (currentIndex >= 0 && currentIndex < stories.length) {
                setCurrentId(currentIndex)
            } else {
                console.error('Index out of bounds. Current index was set to value more than the length of stories array.', currentIndex)
            }
        }
    }, [currentIndex])

    useEffect(() => {
        if (typeof isPaused === 'boolean') {
            setPause(isPaused)
        }
    }, [isPaused])

    const toggleState = (action: string, bufferAction?: boolean) => {
        setPause(action === 'pause')
        setBufferAction(!!bufferAction)
    }

    /**
     * 'autoStoryChange' option can be used to disable auto story change (so this can bw handled by some outer element)
     */
    const previous = () => {
        beforePrevStory && beforePrevStory();
        if (autoStoryChange) {
            setCurrentId(prev => prev > 0 ? prev - 1 : prev)
        }
    }

    const next = () => {
        beforeNextStory && beforeNextStory();
        if (autoStoryChange) {
            if (loop) {
                updateNextStoryIdForLoop()
            } else {
                updateNextStoryId()
            }
        }
    };

    const updateNextStoryIdForLoop = () => {
        setCurrentId(prev => (prev + 1) % stories.length)
    }

    const updateNextStoryId = () => {
        setCurrentId(prev => {
            if (prev < stories.length - 1) return prev + 1
            return prev
        })
    }

    const debouncePause = (e: React.MouseEvent | React.TouchEvent) => {
        // e.preventDefault()
        mousedownId.current = setTimeout(() => {
            toggleState('pause')
        }, 200)
    }

    const mouseUp = (e: React.MouseEvent | React.TouchEvent, type: string) => {
        // e.preventDefault()
        mousedownId.current && clearTimeout(mousedownId.current)
        if (pause) {
            toggleState('play')
        } else {
            type === 'next' ? next() : previous()
        }
    }

    const getVideoDuration = (duration: number) => {
        setVideoDuration(duration * 1000)
    }

    // Enable left/right swipes
    const handlers = useSwipeable({ onSwiped: ({dir}) => {
            if (dir === "Right") {
                previous()
            } else if (dir === "Left") {
                next();
            }
        }});

    return (
        <div style={{ ...styles.container, ...{ width, height } }} {...handlers}>
            <ProgressContext.Provider value={{
                bufferAction: bufferAction,
                videoDuration: videoDuration,
                currentId,
                pause,
                next
            }}>
                <ProgressArray />
            </ProgressContext.Provider>
            <Story
                action={toggleState}
                bufferAction={bufferAction}
                playState={pause}
                story={stories[currentId]}
                getVideoDuration={getVideoDuration}
            />
            <div style={styles.overlay}>
                <div style={{ width: '50%', zIndex: 999 }} onTouchStart={debouncePause} onTouchEnd={e => mouseUp(e, 'previous')} />
                <div style={{ width: '50%', zIndex: 999 }} onTouchStart={debouncePause} onTouchEnd={e => mouseUp(e, 'next')} />
            </div>
        </div>
    )
}

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        background: '#111',
        position: 'relative'
    },
    overlay: {
        position: 'absolute',
        height: 'inherit',
        width: 'inherit',
        display: 'flex'
    }
}