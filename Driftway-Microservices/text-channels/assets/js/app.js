import "../css/app.scss"

// Phoenix LiveView
import {Socket} from "phoenix"
import {LiveSocket} from "phoenix_live_view"

let liveSocket = new LiveSocket("/live", Socket, {params: {_csrf_token: ""}})
liveSocket.connect()

window.liveSocket = liveSocket