const process = require("process");
const SerialPort = require("serialport");
const Readline = require("@serialport/parser-readline");
const ctrl_db = require("./db");

const NUM_COLUMNS = process.env.XE_SECTION_COLUMNS.split(",").length;
const NUM_INTERVAL = process.env.S_INTERVAL || 2000;
const NUM_STOP_INTERVAL = process.env.S_STOP_INTERVAL || 20000;

module.exports = {
  // async fn_search__serial_port() {
  //   if (process.argv[2]) {
  //     this.path__serial_port = process.argv[2];
  //     return;
  //   }

  //   const arr_ports = await SerialPort.list();
  //   for (const p of arr_ports) {
  //     if (/arduino/i.test(port.manufacturer)) {
  //       this.path__serial_port = p.path;
  //       return;
  //     }
  //   }

  //   throw new Error(
  //     `Error: ${__filename} - fn_search__serial_port (No arduino)`
  //   );
  // },
  async fn_handler__serial_port() {
    // await this.fn_search__serial_port();
    // if (!this.path__serial_port) {
    //   console.error("No serial port.");
    //   process.exit(1);
    // }
    // const sp_path = this.path__serial_port;

    const sp_path = process.env.S_PATH;
    const sp_options = { baudRate: 9600 };
    const sp = new SerialPort(sp_path, sp_options);

    const fn_handler__serial_error = (err) => {
      console.error(`Error: ${__filename} - fn_handler__serial_port\n${err}`);
      process.exit(1);
    };

    const fn_handler__serial_stream = () => {
      const sp_parser = sp.pipe(new Readline({ delimiter: "\r\n" }));
      let nested_arr_data = Array(5).fill([]); // 하나의 배열에 빈 배열 9개 생성
      sp_parser.on("data", (str) => {
        let arr_data = str.split(" ");
        if (arr_data.length !== NUM_COLUMNS) return;
        for (let i = 0; i < NUM_COLUMNS; ++i) {
          nested_arr_data[i].push(arr_data[i] * 1); // 숫자형으로 변환
        }
      });
      const fn_dml_insert__at_intervals = async () => {
        if (nested_arr_data[0].length === 0) return;

        const obj_value_table = () => {
          let arr_output = [];
          for (let i = 0; i < NUM_COLUMNS; ++i) {
            const arr_input_data = nested_arr_data[i];
            arr_output = [
              ...arr_output,
              {
                min: Math.min(...arr_input_data) || 0,
                max: Math.max(...arr_input_data) || 0,
                avg:
                  Math.floor(
                    arr_input_data.reduce((x, y) => x + y) /
                      arr_input_data.length
                  ) || 0,
                len: arr_input_data.length || 0,
              },
            ];
            nested_arr_data[i] = [];
          }
          return arr_output;
        };

        await ctrl_db.fn_dml_insert__general(obj_value_table());
      };

      const interval_id = setInterval(
        fn_dml_insert__at_intervals,
        NUM_INTERVAL
      );

      setTimeout(() => {
        clearInterval(interval_id);
      }, NUM_STOP_INTERVAL);
    };

    sp.on("error", fn_handler__serial_error);
    sp.on("open", fn_handler__serial_stream);
  },
};
