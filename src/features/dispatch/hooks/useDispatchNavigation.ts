import { useState } from 'react'

export function useDispatchNavigation() {
    const [startDate, setStartDate] = useState(() => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return today
    })

    const handlePreviousDay = () => {
        const newDate = new Date(startDate)
        newDate.setDate(startDate.getDate() - 1)
        setStartDate(newDate)
    }

    const handleNextDay = () => {
        const newDate = new Date(startDate)
        newDate.setDate(startDate.getDate() + 1)
        setStartDate(newDate)
    }

    return {
        startDate,
        setStartDate,
        handlePreviousDay,
        handleNextDay,
    }
}
