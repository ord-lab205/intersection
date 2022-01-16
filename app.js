const process = require("process");
require("dotenv").config();
const ctrl_db = require("./controller/db");
const ctrl_serial = require("./controller/serial");

(async (process) => {
  await ctrl_db.fn_connection__xe();

  ctrl_serial.fn_handler__serial_port();

  process
    .once("SIGTERM", ctrl_db.fn_oper__at_termination)
    .once("SIGINT", ctrl_db.fn_oper__at_termination);
})(process);
