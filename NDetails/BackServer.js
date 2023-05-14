fcf.module({
  name: "fcf-framework-unitest:NDetails/BackServer.js",
  dependencies: ["express", "body-parser"],
  module:(libExpress, libBodyParser)=>{
    let Namespace = fcf.prepare(fcf, "NUnitest.NDetails");

    fcf.addException("UNITEST_INVALID_REQUEST_FORMAT", "Invalid request format for unitest");
    fcf.addException("UNITEST_INVALID_TEST_ID", "Invalid test ID");
    fcf.addException("UNITEST_INVALID_TEST_MESSAGE", "Invalid message format for test");

    Namespace["BackServer"] = class BackServer {
      constructor(a_port, a_pages) {
        this._server = libExpress();
        this._port   = a_port;
        this._pages  = a_pages;
      }

      setId(a_id){
        this._id = a_id;
      }

      onStep(a_cb){
        this._cbStep = a_cb;
      }

      onMessage(a_cb){
        this._cbMessage = a_cb;
      }

      run() {
        return fcf.actions()
        .then((a_res, a_act) => {

          this._server.use(libBodyParser.json());

          this._server.use((a_req, a_res, a_next) => {
            a_res.header("Access-Control-Allow-Origin", "*");
            a_res.header("Access-Control-Allow-Headers", "Content-Type, Content-Length");
            a_res.header("Access-Control-Allow-Methods", "PUT, POST");
            a_res.header("Content-Type", "application/json");
            a_next();
          });

          this._server.post("/getstep", (a_req, a_res) => {
            if (a_req.body.id != this._id) {
              a_res.status(400).send({ error: new fcf.Exception("UNITEST_INVALID_TEST_ID") });
              return;
            }
            if (isNaN(a_req.body.step)){
              a_res.status(400).send({ error: new fcf.Exception("UNITEST_INVALID_REQUEST_FORMAT") });
              return;
            }
            let step = parseInt(a_req.body.step);
            if (this._cbStep)
              this._cbStep(step);
            a_res.status(200).send(this._pages[step] ? this._pages[step] : {});
          });

          this._server.put("/message", (a_req, a_res) => {
            if (a_req.body.id != this._id) {
              a_res.status(400).send({ error: new fcf.Exception("UNITEST_INVALID_TEST_ID") });
              return;
            }
            try {
              if (this._cbMessage) {
                this._cbMessage(a_req.body);
              }
            } catch (e) {
            }
            a_res.status(200).send({});
          });

          this._listenServer = this._server.listen(this._port, () => {
            a_act.complete();
          });

        });
      }

      stop() {
        try {
          if (this._listenServer)
            this._listenServer.close();
        } catch(e) {
        }
      }
    };

    return Namespace["BackServer"];
  }
});
