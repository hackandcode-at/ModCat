import { category } from "../../utils"
import info from "./info"
import warn from "./warn"
import kick from "./kick"
import ban from "./ban"
import mute from "./mute"
import unmute from "./unmute"
import timeout from "./timeout"
import infractions from "./infractions"
import clear from "./clear"

export default category('General', [
    info,
    warn,
    kick,
    ban,
    mute,
    unmute,
    timeout,
    infractions,
    clear,
])