const oracledb = require("oracledb");
const config__oracle_info = require("../config/oracle");

const COMMON_XE_TABLE = "general";
const arr_columns__common_sensor_types = [
  "vibration_1_val",
  "vibration_2_val",
  "vibration_3_val",
  "noise_1_val",
  "noise_2_val",
  "noise_3_val",
];
const arr_columns__sensor_type__tunnel = [...arr_columns__common_sensor_types];
const arr_column_params = arr_columns__sensor_type__tunnel.map((el, i) => {
  return `VAL${i}`;
});
const obj_option__bind_defs = arr_column_params.reduce(
  (obj, t) => ((obj[t] = { type: oracledb.DB_TYPE_NUMBER }), obj),
  {}
);

const TUNNEL_COLUMNS = arr_columns__sensor_type__tunnel.join();
const DML_INSERT__SQL_QUERY = `INSERT INTO ${COMMON_XE_TABLE} (${TUNNEL_COLUMNS}) VALUES (${arr_column_params})`;
const DML_ISNERT__OPTIONS = {
  autoCommit: true,
  bindDefs: obj_option__bind_defs,
};
const NUM_COLUMNS = arr_column_params.length;

module.exports = {
  async fn_connection__xe() {
    await oracledb.createPool(config__oracle_info);
    this.conn = await oracledb.getConnection();
  },

  fn_oper__at_termination() {
    try {
      if (this.conn) {
        conn.close().then(() => {
          oracledb.getPool().close(10);
          process.exit(0);
        });
      }
    } catch (err) {
      console.error(`Error: db/index.js - fn_oper__at_termination\n${err}`);
      process.exit(1);
    }
  },

  async fn_dml_insert__general(data) {
    let arr_bind_params = [];
    for (let i = 0; i < NUM_COLUMNS; i++) {
      arr_bind_params = [...arr_bind_params, data[i].avg];
    }
    await this.conn.execute(
      DML_INSERT__SQL_QUERY,
      arr_bind_params,
      DML_ISNERT__OPTIONS
    );
  },
};
