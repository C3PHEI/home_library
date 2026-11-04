import { roomIconEntry, roomIconKey } from '../../utils/icons.js'

// Icon neben dem Raumnamen: eigenes Icon oder aus dem Namen geraten
export default function RoomIcon({ room, size = 19 }) {
    const { Icon } = roomIconEntry(roomIconKey(room))
    return <Icon size={size} aria-hidden="true" />
}