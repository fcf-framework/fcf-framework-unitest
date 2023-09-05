if (typeof fcf == "undefined" && typeof module === "object" && typeof module.filename !== "undefined") {
  require("fcf-framework-core");
}
fcf.module({
  name: "fcf-framework-unitest:unitest.js",
  dependencies: [],
  lazy: [],
  module: ()=>{

    let Namespace = fcf.prepare(fcf, "NUnitest");

    fcf.addException("UNITEST_EQUAL", "\"@{{left}}@\" and \"@{{right}}@\" are not equal");
    fcf.addException("UNITEST_NOT_EQUAL", "\"@{{left}}@\" and \"@{{right}}@\" are equal");
    fcf.addException("UNITEST_LESS", "\"@{{left}}@\" is not less than \"@{{right}}@\"");
    fcf.addException("UNITEST_LESS_EQUAL", "\"@{{left}}@\" is not less than \"@{{right}}@\" or not equal");
    fcf.addException("UNITEST_GREATER", "\"@{{left}}@\" is not greater than \"@{{right}}@\"");
    fcf.addException("UNITEST_GREATER_EQUAL", "\"@{{left}}@\" is not greater than \"@{{right}}@\" or not equal");
    fcf.addException("UNITEST_ERROR", "@{{error}}@");

    fcf.addException("UNUTEST_WEB_COMMAND_UNSET", "Web unit test command not installed for unitest.run() (Options: webProcesses.command)");
    fcf.addException("UNITEST_ERROR_EXEC_COMMAND", "Child process \"@{{process}}@\" exited with an error");
    fcf.addException("UNITEST_FAILD_BROWSER_TEST", "Failed to run test in browser. Command: \"@{{command}}@\". @{{error}}@");
    fcf.addException("UNITEST_FAILD_SEND_MESSAGE", "Failed to send message to test server \"@{{url}}@\"");
    fcf.addException("UNITEST_TIMEOUT", "Test timed out");

    /// @class fcf.NUnitest.Unitest
    /// @brief The class that performs the testing is available through the singleton fcf.NUnitest.unitest
    Namespace["Unitest"] = class {

      constructor(_a_isNotRoot) {
        this._isRoot = !_a_isNotRoot;
        this._tests  = _a_isNotRoot ? fcf.NUnitest.unitest._tests : {};
      }



      /// @method add(string a_part, string a_group, string a_name, function a_cbtest)
      /// @method add(string a_group, string a_name, function a_cbtest)
      /// @method add(string a_name, function a_cbtest)
      /// @brief Adds a test, it is recommended to use the fcf.test() function,
      ///        which will load the fcf-framework-unitest:unitest.js executable JS module if necessary
      /// @param string a_part = "default" - Test part name. The testing section
      ///                                    allows you to separate tests, for example,
      ///                                    into basic ones, which do not require the application to be launched,
      ///                                    and application tests, which require the entire application to be launched.
      /// @param string a_group = "default" - Test group name.
      /// @param string a_test - Test name.
      /// @param function a_cbtest - test function
      ///                           - Function signature:
      ///                             <async> void a_cbtest(fcf.NUnitest.Unitest a_unitest)
      ///                              - fcf.NUnitest.Unitest a_unitest - the test instance that is created by singleton
      ///                                                                 when the run() method is invoked
      /// @example Example of adding a test
      ///
      /// :tests/replaceAll.js file:
      ///
      ///   fcf.test("strings", "Function replaceAll", (a_unitest)=>{
      ///     a_unitest.equal(fcf.replaceAll("1234", "2", "_"), "1_34");
      ///   });
      ///
      /// :index.js file:
      ///
      ///   let fcf = require("fcf-framework-core");
      ///   let unitest = require("fcf-framework-unitest");
      ///
      ///   unitest.run({
      ///     include: [":tests/replaceAll.js"],
      ///   })
      ///   .catch((a_error)=>{
      ///     console.error("System error: ", a_error);
      ///   });
      add(a_part, a_group, a_name, a_cbtest) {
        if (!this._isRoot){
          fcf.NUnitest.unitest.add.apply(fcf.NUnitest.unitest, arguments);
          return;
        }
        if (typeof a_name === "function"){
          a_cbtest  = a_name;
          a_name    = a_group;
          a_group   = a_part;
          a_part    = "default";
        } else if (typeof a_group === "function"){
          a_cbtest  = a_group;
          a_name    = a_part;
          a_group   = "default";
          a_part    = "default";
        } else if (typeof a_part === "function"){
          a_cbtest  = a_part;
          a_name    = fcf.uuid();
          a_group   = "default";
          a_part    = "default";
        }
        fcf.prepare(this._tests, [a_part, a_group]);
        this._tests[a_part][a_group][a_name] = a_cbtest;
      }



      /// @method fcf.Actions->object run(object a_options)
      /// @brief Performs both server-side and browser-side testing
      /// @param object a_options - Test execution options
      ///         - Object items:
      ///           - [string]|string parts = undefined - Test part name. The testing section
      ///                                    allows you to separate tests, for example,
      ///                                    into basic ones, which do not require the application to be launched,
      ///                                    and application tests, which require the entire application to be launched.
      ///           - [string]|string groups = undefined - Test group name.
      ///           - [string]|string tests = undefined - Test name.
      ///           - boolean   enableWebTests = true - Flag allowing execution of tests on the browser side
      ///           - boolean   enableLocalTests = true - Flag to allow running tests on the nodejs server side.
      ///                                                  Browser-side testing will only be performed if the webTestingPages
      ///                                                  array is not empty and enableLocalTests is true.
      ///           - [string] include = [] - An array of included JS files during testing.
      ///                                     File paths are specified in FCF path notation. see fcf.getPath() function description
      ///           - boolean quiet = false - If it is true, then the output to the console about the testing is not performed
      ///           - integer timeout = 30000 - Single test execution timeout in milliseconds.
      ///           - [object] processes = [] - An array with a description of the processes that will be launched before testing.
      ///                                  When testing is complete, the processes are terminated.
      ///                                   - Object items:
      ///                                     - string|array command - start command, can be given as a single line or
      ///                                                              an array of command line start arguments.
      ///                                     - integer startTimeout = 1000 - Time in milliseconds to wait for the application to start
      ///           - [object]  webProcesses = [] - An array describing the processes that will be launched before testing on the
      ///                                           browser side. Used to launch WEB services. Runs only if enableWebTests is true and
      ///                                           the webTestingPages array is not empty. When testing is complete, the processes are terminated.
      ///                                   - Object items:
      ///                                     - string|array command - start command, can be given as a single line or
      ///                                                              an array of command line start arguments.
      ///                                     - integer startTimeout = 1000 - Time in milliseconds to wait for the application to start
      ///           - [string|[string]] webBrowsers = [["google-chrome", "chrome", "chromium", "firefox", "opera", "safari"]] -
      ///                                             An array with a list of browsers for which testing will be performed.
      ///                                             If the array element is an array, then the test will run for the first browser
      ///                                             in the nested array that is successfully run.
      ///           - [object]  webTestingPages = [] - An array with information about the pages for which testing will be performed on the browser side
      ///                       - Object items:
      ///                         - string url - URL of the page being tested
      ///                         - [string] include = [] - Array of included URL JS files on the browser side where tests can be located
      ///           - integer   webTestingPort = 4589 - TCP port for transmitting internal testing commands on the browser side
      ///           - function onMessage = undefined - Callback event of information output to the console
      ///                     -  Function signature:
      ///                         onMessage(object a_info)
      ///                             - object a_info - An object with information about output to the console
      ///                                 - string part - The name of the test part that is currently running
      ///                                 - string group - The name of the test group that is currently running
      ///                                 - string test - The name of the test currently running
      ///                                 - string level - Logging level (test|crash|error|warning|log|info|debug|trace)
      ///                                 - string source - The name of the module from which the logging was performed
      ///                                 - string executor - Test executor. If the test was run on the server,
      ///                                                     then the value is equal to "server",
      ///                                                     if the test was performed on the browser side,
      ///                                                     then the value is equal to the name of the browser process
      ///                                 - Date time - log time
      ///                                 - string message - Displayed message
      /// @result fcf.Actions->object - Returns an object with information about testing in a delayed action (similar to Promise)
      ///         - Object items:
      ///           - integer errorCount - Number of tests executed with errors
      ///           - integer testCount - Number of tests performed
      ///           - integer successfulCount - Number of tests completed successfully
      ///           - [object] tests - Array with information about executed tests
      ///               - Object items:
      ///                      - string part - The name of the test part
      ///                      - string group - The name of the test group
      ///                      - string test - The name of the test
      ///                      - string executor - Test executor. If the test was run on the server,
      ///                                          then the value is equal to "server",
      ///                                          if the test was performed on the browser side,
      ///                                          then the value is equal to the name of the browser process
      ///                      - string status - Test state ("error"|"ok")
      ///                      - Error error - Test error object
      ///                      - [object] output - An array with information about the output to the
      ///                                          console that was executed during the test execution.
      ///                                          For a description of the object elements, see the description of
      ///                                          the onMessage parameter
      ///           - [object] output - An array with information about output to the console.
      ///                               For a description of the object elements,
      ///                               see the description of the onMessage parameter.
      run(a_options) {
        return this._run(a_options);
      }



      /// @method compare(string a_operation, a_left, a_right, boolean a_strict = false)
      /// @brief Compares two values against the comparison operation a_operation
      ///        and if the comparison is not correct, it causes a test error
      /// @param string a_operation - Comparison operation
      ///                             - Accepted values:
      ///                                 - "=" | "==" - Comparison operation
      ///                                 - "!=" - Inequality operation
      ///                                 - "<" - Operation less
      ///                                 - "<=" - Operation less than or equal to
      ///                                 - ">" - Operation more
      ///                                 - ">=" - Operation greater than or equal to
      /// @param mixed a_left - First comparison value
      /// @param mixed a_right - Second compared value
      /// @param boolean a_strict = false - If true, then strict comparison is used (===)
      compare(a_operation, a_left, a_right, a_strict) {
        let c = fcf.compare(a_left, a_right, a_strict);
        if (a_operation == "!=") {
          if (c == 0) {
            this._task.currentTestInfo.error = new fcf.Exception("UNITEST_NOT_EQUAL", {left: fcf.str(a_left), right: fcf.str(a_right)});
            throw this._task.currentTestInfo.error;
          }
        } else if (a_operation == "=" || a_operation == "==") {
          if (c != 0) {
            let error = new fcf.Exception("UNITEST_EQUAL", {left: fcf.str(a_left), right: fcf.str(a_right)});
            if (this._task && this._task.currentTestInfo)
              this._task.currentTestInfo.error = error
            throw error;
          }
        } else if (a_operation == "<") {
          if (c >= 0) {
            let error = new fcf.Exception("UNITEST_LESS", {left: fcf.str(a_left), right: fcf.str(a_right)});
            if (this._task && this._task.currentTestInfo)
              this._task.currentTestInfo.error = error
            throw error;
          }
        } else if (a_operation == "<=") {
          if (c > 0) {
            let error = new fcf.Exception("UNITEST_LESS_EQUAL", {left: fcf.str(a_left), right: fcf.str(a_right)});
            if (this._task && this._task.currentTestInfo)
              this._task.currentTestInfo.error = error
            throw error;
          }
        } else if (a_operation == ">") {
          if (c <= 0) {
            let error = new fcf.Exception("UNITEST_GREATER", {left: fcf.str(a_left), right: fcf.str(a_right)});
            if (this._task && this._task.currentTestInfo)
              this._task.currentTestInfo.error = error
            throw error;
          }
        } else if (a_operation == ">=") {
          if (c < 0) {
            let error = new fcf.Exception("UNITEST_GREATER_EQUAL", {left: fcf.str(a_left), right: fcf.str(a_right)});
            if (this._task && this._task.currentTestInfo)
              this._task.currentTestInfo.error = error
            throw error;
          }
        }
      }



      /// @method error(Error|string a_error)
      /// @brief Sets a test error and exit from test
      ///        Called on the fcf.NUnitest.unitest object passed through the fcf.test() test callback argument
      /// @param Error|string a_error - Error information
      error(a_error) {
        let error = new fcf.Exception("UNITEST_ERROR", {error: a_error instanceof Error ? "Test execution error" : fcf.str(a_error)}, a_error instanceof Error ? a_error : undefined);
        if (this._task && this._task.currentTestInfo)
          this._task.currentTestInfo.error = error;
        throw error;
      }



      /// @method equal(mixed a_left, mixed a_right, boolean a_strict = false)
      /// @brief Compares two values and if they are not equal raises a test error
      /// @param mixed a_left - First comparison value
      /// @param mixed a_right - Second compared value
      /// @param boolean a_strict = false - If true, then strict comparison is used (===)
      equal(a_left, a_right, a_strict) {
        return this.compare("==", a_left, a_right, a_strict);
      }



      /// @method notEqual(mixed a_left, mixed a_right, boolean a_strict = false)
      /// @brief Compares two values and if they are equal raises a test error
      /// @param mixed a_left - First comparison value
      /// @param mixed a_right - Second compared value
      /// @param boolean a_strict = false - If true, then strict comparison is used
      notEqual(a_left, a_right, a_strict) {
        return this.compare("!=", a_left, a_right, a_strict);
      }



      /// @method less(mixed a_left, mixed a_right)
      /// @brief Compares two values and if the first value is greater or equal to the second than, throws a test error.
      /// @param mixed a_left - First comparison value
      /// @param mixed a_right - Second compared value
      less(a_left, a_right) {
        return this.compare("<", a_left, a_right);
      }



      /// @method lessEqual(mixed a_left, mixed a_right)
      /// @brief Compares two values, and if the first value is not less or equal to the second than, throws a test error.
      /// @param mixed a_left - First comparison value
      /// @param mixed a_right - Second compared value
      lessEqual(a_left, a_right) {
        return this.compare("<=", a_left, a_right);
      }



      /// @method greater(mixed a_left, mixed a_right)
      /// @brief Compares two values and if the first value is not greater than throws a test error.
      /// @param mixed a_left - First comparison value
      /// @param mixed a_right - Second compared value
      greater(a_left, a_right) {
        return this.compare(">", a_left, a_right);
      }



      /// @method greaterEqual(mixed a_left, mixed a_right)
      /// @brief Compares two values and if the first value is not greater or not equal  to the second then, throws a test error.
      /// @param mixed a_left - First comparison value
      /// @param mixed a_right - Second compared value
      greaterEqual(a_left, a_right) {
        return this.compare(">=", a_left, a_right);
      }



      runAutoTests(a_options) {
        let route   = new fcf.RouteInfo(window.location.href);
        let host    = route.args.___fcf_unitest_host || "localhost";
        let port    = route.args.___fcf_unitest_port;
        let browserTestId  = route.args.___fcf_unitest_id;
        let tests   = Array.isArray(route.args.___fcf_unitest_tests) ? route.args.___fcf_unitest_tests : undefined;
        let groups  = Array.isArray(route.args.___fcf_unitest_groups) ? route.args.___fcf_unitest_groups : undefined;
        let parts   = Array.isArray(route.args.___fcf_unitest_parts) ? route.args.___fcf_unitest_parts  : undefined;
        let step    = !isNaN(route.args.___fcf_unitest_step) ? parseInt(route.args.___fcf_unitest_step) : 0;
        let include = route.args.___fcf_unitest_include ? route.args.___fcf_unitest_include : [];
        let wait    = !isNaN(parseInt(route.args.___fcf_unitest_wait)) ? parseInt(route.args.___fcf_unitest_wait) :
                                                                         route.args.___fcf_unitest_wait;
        return fcf.actions()
        .then(()=>{
          return this._run(fcf.append(
                                   {},
                                   a_options,
                                   {
                                     id:    browserTestId,
                                     parts: parts,
                                     groups: groups,
                                     tests: tests,
                                     include: include
                                   }
                                 ),
                        {
                          host: host,
                          port: port,
                        },
                        wait
                      );
        })
        .then(async (a_result)=>{
          if(!host || !port)
            return;
          let url = `http://${host}:${port}/getstep`;
          try {
            ++step;
            let data = {
              step: step,
              id: browserTestId,
            };
            let res = await fetch(url,
                  {
                    method:  "POST",
                    mode:    "cors",
                    headers: { "Content-Type": "application/json" },
                    body:    JSON.stringify(data)
                  });
            let resData = await res.json();
            if (resData.url){
              let route   = new fcf.RouteInfo(resData.url, "root");
              route.urlArgs.___fcf_unitest        = undefined;
              route.urlArgs.___fcf_unitest_host   = host;
              route.urlArgs.___fcf_unitest_port   = port;
              route.urlArgs.___fcf_unitest_step   = step;
              route.urlArgs.___fcf_unitest_groups = groups;
              route.urlArgs.___fcf_unitest_parts  = parts;
              route.urlArgs.___fcf_unitest_tests  = tests;
              route.urlArgs.___fcf_unitest_id     = browserTestId;
              route.urlArgs.___fcf_unitest_include = Array.isArray(resData.include) ? resData.include : [];
              window.location.href = fcf.buildUrl(route);
            }
          } catch(e) {
            throw new fcf.Exception("UNITEST_FAILD_SEND_MESSAGE", {url: url}, e);
          }
        });
      }



      _run(a_options, a_autoTestOptions, a_wait) {
        if (this._isRoot) {
          return fcf.actions()
          .then(()=>{
            let ut = new Namespace["Unitest"](true);
            return ut._run(a_options, a_autoTestOptions, a_wait);
          });
        }
        let self = this;
        a_options = fcf.append(
                      {
                        enableWebTests:    true,
                        enableLocalTests: true,
                        processes:         [],
                        timeout:           30000,
                        webTestingPort:    4589,
                        webBrowsers:       [["google-chrome", "chrome", "chromium", "firefox", "opera", "safari"]],
                        webProcesses: [],
                        webTestingPages:   []
                      },
                      a_options);
        this._task = {
          options:        a_options,
          result:  {
            errorCount:       0,
            testCount:        0,
            successfulCount:  0,
            tests:            [],
            output:           [],
          },
          currentTest:    undefined,
          currentPart:    undefined,
          currentGroup:   undefined,
          selfOutput:     false,
          originLog:      undefined,
          originError:    undefined,
          originWarn:     undefined,
          outputActions:  fcf.actions(),
          pushOutput:     function (a_executor, a_level, a_source, a_exdata, a_arguments) {
            let message = {
              unitest:    self,
              part:       this.currentPart,
              group:      this.currentGroup,
              test:       this.currentTest,
              level:      a_level,
              source:     a_source,
              executor:   a_executor,
              time:       new Date(),
              message:    fcf.trim(fcf.append([], a_arguments).map((val)=>{ return fcf.str(val) }).join(" "), ["\r", "\n"])
            };
            if (this.currentTestInfo) {
              this.currentTestInfo.output.push(message);
            }
            if (this.options.onMessage){
              this.options.onMessage(message);
            }
            fcf.getEventChannel().send("unitest_message", message)
            this.result.output.push(message);
            if (a_autoTestOptions && a_autoTestOptions.host && a_autoTestOptions.port) {
              this.outputActions.then(async ()=>{
                let url = `http://${a_autoTestOptions.host}:${a_autoTestOptions.port}/message`;
                try {
                  let data = fcf.append({}, message, a_exdata);
                  delete data.unitest;
                  data.id = this.options.id;
                  let res = await fetch(url,
                        {
                          method:  "PUT",
                          mode:    "cors",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body:    JSON.stringify(data)
                        });
                } catch(e) {
                  throw new fcf.Exception("UNITEST_FAILD_SEND_MESSAGE", {url: url}, e);
                }
              })
            }
          }
        };

        this._task.outputActions
        .catch((a_error)=>{
          this._err(a_error);
        });

        let processes = [];

        let partsNames;
        let groupsNames;
        let testsNames;
        return fcf.actions()
        .then(async ()=>{
          let include = this._task.options.include;
          if (include && typeof include == "string"){
            include = [include];
          }
          if (Array.isArray(include)){
            await fcf.require(include);
          }

          partsNames  = this._quantityToOptionArray(this._task.options.parts);
          groupsNames  = this._quantityToOptionArray(this._task.options.groups);
          testsNames  = this._quantityToOptionArray(this._task.options.tests);
        })
        .then(()=>{
          if (typeof a_wait == "string") {
            let func = fcf.resolve(window, a_wait);
            return func();
          } else if (typeof a_wait == "number") {
            return fcf.actions()
            .then((a_res, a_act)=>{
              setTimeout(()=>{
                a_act.complete();
              }, a_wait);
            });
          }
        })
        .then(async ()=>{
          await this._startTests();
          await this._logTestsStart(partsNames, groupsNames, testsNames);
        })
        .each(this._task.options.processes, (a_key, a_processInfo, a_res, a_act)=>{
          if (!this._isSelected(a_processInfo.tests, testsNames)){
            a_act.complete();
            return;
          }
          if (!this._isSelected(a_processInfo.groups, groupsNames)){
            a_act.complete();
            return;
          }
          if (!this._isSelected(a_processInfo.parts, partsNames)){
            a_act.complete();
            return;
          }
          let libChildProcess = require("child_process");
          let libFCFProcess   = require("fcf-framework-core/NProcess/NProcess.js");
          let endTimer;
          let commandInfo = libFCFProcess.commandFromString(a_processInfo.command);

          let process = libChildProcess.spawn(commandInfo.command, commandInfo.args);
          processes.push(process);

          this._log(`Child process "${a_processInfo.command}" started with pid ${process.pid}`);
          process.stdout.on("data", (a_data) => {
            this._log(`Sub process "${commandInfo.command}" stdout:`, fcf.Logger.offset(4, ` [${commandInfo.command} PID: ${process.pid}]> `), "\n" , a_data.toString());
          });

          process.stderr.on("data", (a_data) => {
            this._err(`Sub process "${commandInfo.command}" stderr:`, fcf.Logger.offset(4, ` [PID: ${process.pid}]> `), "\n" , a_data.toString());
          });

          process.on("error", (a_error) => {
            clearTimeout(endTimer);
            a_act.error(new fcf.Exception("UNITEST_ERROR_EXEC_COMMAND", {process: a_processInfo.command}));
          });

          process.on("exit", (a_exitCode) => {
            clearTimeout(endTimer);
            if (a_exitCode) {
              a_act.error(new fcf.Exception("UNITEST_ERROR_EXEC_COMMAND", {process: a_processInfo.command}));
            } else {
              a_act.complete();
            }
          });

          processes.push(process);

          endTimer = setTimeout(() => {
            a_act.complete();
          }, a_processInfo.startTimeout || 1000);
        })
        .then(()=>{
          if (this._task.options.enableLocalTests)
            return this._runLocalTests(partsNames, groupsNames, testsNames);
        })
        .then(()=>{
          if (this._task.options.enableWebTests && !fcf.empty(this._task.options.webTestingPages))
            return this._runWebTests(partsNames, groupsNames, testsNames);
        })
        .then(()=>{
          return this._logTestsEnd();
        })
        .finally(()=> {
          return fcf.actions()
          .then((a_res, a_act)=>{
            this._task.outputActions.finally(()=>{ a_act.complete(); });
          })
          .then(()=>{
            return this._endTests();
          })
        })
        .finally(()=>{
          for(let process of processes) {
            try {
              process.kill();
            } catch(e){
            }
          }
        })
        .then(()=>{
          return this._task.result;
        });
      }



      async _runLocalTests(a_partsNames, a_groupsNames, a_testsNames){
        let tests = [];
        for(let part in this._tests) {
          if (a_partsNames && a_partsNames.indexOf(part) == -1)
            continue;
          for(let group in this._tests[part]) {
            if (a_groupsNames && a_groupsNames.indexOf(group) == -1)
              continue;
            for(let name in this._tests[part][group]) {
              if (a_testsNames && a_testsNames.indexOf(name) == -1)
                continue;
             tests.push({
               part: part,
               group: group,
               name: name,
               test: this._tests[part][group][name]
             });
            }
          }
        }

        if (tests.length) {
          this._log("");
          this._log("Start local tests...");
          this._log("--------------------");
        }

        for(let test of tests) {
          this._task.currentPart = test.part;
          this._task.currentGroup = test.group;
          this._task.currentTest = test.name;
          this._task.currentTestInfo = {
            part:      test.part,
            group:     test.group,
            test:      test.name,
            executor:  fcf.isServer() ? "server" : "browser",
            status:    undefined,
            error:     undefined,
            output:    [],
          };
          this._logEx({command: "start_test"  },
                      `Test [${this._task.currentPart}][${this._task.currentGroup}][${this._task.currentTest}] running ...`);
          let timer;
          try {
            await fcf.actions()
            .then(async (a_res, a_act)=>{
              timer = setTimeout(() => {
                a_act.error(new fcf.Exception("UNITEST_TIMEOUT"));
              }, this._task.options.timeout);
              await test.test(this);
              a_act.complete();
            });
            if (this._task.currentTestInfo.error) {
              throw this._task.currentTestInfo.error;
            }
            this._task.currentTestInfo.status = "ok";
            this._logEx({command: "end_test", error: undefined  } ,
                        `Test [${this._task.currentPart}][${this._task.currentGroup}][${this._task.currentTest}] is completed.`);
          } catch(e) {
            this._task.currentTestInfo.status = "error";
            this._task.currentTestInfo.error = this._getErrorInfo(e);
            this._errEx(
                      {command: "end_test", error: e  },
                      `Test [${this._task.currentPart}][${this._task.currentGroup}][${this._task.currentTest}] is failed. \n`+
                      `Position: ${this._task.currentTestInfo.error.file}:${this._task.currentTestInfo.error.line}\n` +
                      `Error:   `, fcf.str(this._task.currentTestInfo.error.error, true));
          }
          clearTimeout(timer);
          this._task.result.tests.push(this._task.currentTestInfo);
          if (this._task.currentTestInfo.status == "error") {
            ++this._task.result.errorCount;
          } else {
            ++this._task.result.successfulCount;
          }
          ++this._task.result.testCount;
          this._task.currentTestInfo = undefined;
        }
        this._task.currentPart = undefined;
        this._task.currentGroup = undefined;
        this._task.currentTest = undefined;
        this._task.currentTestInfo = undefined;
      }



      async _runWebTests(a_partsNames, a_groupsNames, a_testsNames){
        if (fcf.empty(this._task.options.webTestingPages) || !fcf.isServer())
          return;

        let libChildProcess = require("child_process");
        let libFCFProcess = require("fcf-framework-core/NProcess/NProcess.js");
        let BackServer = require("fcf-framework-unitest/NDetails/BackServer.js");
        let backServer;
        let processes = [];
        return fcf.actions()
        .then(()=>{
          this._log("");
          this._log("Start web tests...");
          this._log("--------------------");
        })
        // running sub processes
        .each(this._task.options.webProcesses, async (k, cmdInfo, a_res, a_act)=>{
          if (!this._isSelected(cmdInfo.tests, a_testsNames)){
            a_act.complete();
            return;
          }
          if (!this._isSelected(cmdInfo.groups, a_groupsNames)){
            a_act.complete();
            return;
          }
          if (!this._isSelected(cmdInfo.parts, a_partsNames)){
            a_act.complete();
            return;
          }

          let endTimer;
          let process;
          if (fcf.empty(cmdInfo.command) || (!Array.isArray(cmdInfo.command) && typeof cmdInfo.command !== "string")){
            throw new fcf.Exception("UNUTEST_WEB_COMMAND_UNSET", {});
          }

          let cmdStr = Array.isArray(cmdInfo.command) ? libFCFProcess.commandToString(cmdInfo.command)
                                                      : cmdInfo.command;
          let cmdProc;
          let cmdArgs;
          if (Array.isArray(cmdInfo.command)) {
            cmdArgs = fcf.clone(cmdInfo.command);
            cmdProc = cmdArgs.shift();
          } else {
            let info = libFCFProcess.commandFromString(cmdInfo.command);
            cmdProc  = info.command;
            cmdArgs  = info.args;
          }
          this._log(`Start process: ${cmdStr}`);

          process = libChildProcess.spawn(cmdProc, cmdArgs);
          processes.push(process);
          this._log(`Child process "${cmdProc}" started with pid ${process.pid}`);

          process.stdout.on("data", (a_data) => {
            this._log(`Sub process "${cmdProc}" stdout:`, fcf.Logger.offset(4, ` [${cmdProc} PID: ${process.pid}]> `), "\n" , a_data.toString());
          });

          process.stderr.on("data", (a_data) => {
            this._err(`Sub process "${cmdProc}" stderr:`, fcf.Logger.offset(4, ` [PID: ${process.pid}]> `), "\n" , a_data.toString());
          });

          process.on("error", (a_error) => {
            clearTimeout(endTimer);
            a_act.error(new fcf.Exception("UNITEST_ERROR_EXEC_COMMAND", {process: cmdStr}));
          });

          process.on("exit", (a_exitCode) => {
            clearTimeout(endTimer);
            if (a_exitCode) {
              a_act.error(new fcf.Exception("UNITEST_ERROR_EXEC_COMMAND", {process: cmdStr}));
            }
          });

          endTimer = setTimeout(()=>{
            a_act.complete();
          }, !isNaN(cmdInfo.startTimeout) ? cmdInfo.startTimeout : 1000)
        })

        .then(()=>{
          this._log(`Start back server on port ${this._task.options.webTestingPort}`);
          backServer = new BackServer(this._task.options.webTestingPort, this._task.options.webTestingPages);
          return backServer.run();
        })
        // running tests
        .each(this._task.options.webBrowsers, async (a_key, a_browsers)=>{
          a_browsers = Array.isArray(a_browsers) ? a_browsers : [a_browsers];
          let lastError;
          let lastCommand;
          let complete;
          for(let i = 0; i < a_browsers.length; ++i) {
            let browserTestId = fcf.id();
            lastError = undefined;
            try {
              let process;
              let timer;
              await fcf.actions()
              .then((a_res, a_act)=>{
                lastCommand = a_browsers[i];
                if (lastCommand.indexOf("{{") == -1){
                  lastCommand += " \"@{{url}}@\"";
                }
                let include = Array.isArray(this._task.options.webTestingPages[0].include)     ? this._task.options.webTestingPages[0].include :
                              typeof this._task.options.webTestingPages[0].include == "string" ? [this._task.options.webTestingPages[0].include] :
                                                                                             [];
                let url     = this._task.options.webTestingPages[0].url;
                url         += url.indexOf("?") == -1 ? "?" : "&";
                url         += `___fcf_unitest&___fcf_unitest_host=localhost&`+
                               `___fcf_unitest_port=${this._task.options.webTestingPort}&`+
                               `___fcf_unitest_tests=${encodeURIComponent(JSON.stringify(this._task.options.tests))}&`+
                               `___fcf_unitest_groups=${encodeURIComponent(JSON.stringify(this._task.options.groups))}&`+
                               `___fcf_unitest_parts=${encodeURIComponent(JSON.stringify(this._task.options.parts))}&`+
                               `___fcf_unitest_id=${browserTestId}&`+
                               (this._task.options.webTestingPages[0].wait ? `___fcf_unitest_wait=${this._task.options.webTestingPages[0].wait}&`: "") +
                               `___fcf_unitest_include=${encodeURIComponent(JSON.stringify(include))}`;
                lastCommand = fcf.tokenize(lastCommand, {url: url}, {quiet: true});
                let commandInfo = libFCFProcess.commandFromString(lastCommand);

                backServer.setId(browserTestId);
                backServer.onStep((a_stepIndex) => {
                  if (Array.isArray(this._task.options.webTestingPages) &&
                      this._task.options.webTestingPages[a_stepIndex] &&
                      this._task.options.webTestingPages[a_stepIndex].url) {
                    let step = this._task.options.webTestingPages[a_stepIndex];
                    let route = new fcf.RouteInfo(this._task.options.webTestingPages[a_stepIndex].url, "root");
                    route.urlArgs.___fcf_unitest = undefined;
                    route.urlArgs.___fcf_unitest_host = "localhost";
                    route.urlArgs.___fcf_unitest_port = this._task.options.webTestingPort;
                    route.urlArgs.___fcf_unitest_include = Array.isArray(step.include) ? step.include : [];
                    route.urlArgs.___fcf_unitest_step = a_stepIndex;
                    route.urlArgs.___fcf_unitest_id = browserTestId;
                    route.urlArgs.___fcf_unitest_wait = this._task.options.webTestingPages[a_stepIndex].wait;

                    let url = fcf.buildUrl(route);
                    this._msg(
                      commandInfo.command,
                      {
                        unitest:    this,
                        part:       undefined,
                        group:      undefined,
                        test:       undefined,
                        level:      "log",
                        source:     "UniTest",
                        executor:   commandInfo.command,
                        time:       new Date(),
                        message:    `Go to page ${url}`,
                      }
                    );
                  } else {
                    complete = true;
                    if (timer) {
                      clearTimeout(timer);
                    }
                    a_act.complete();
                  }
                });

                backServer.onMessage((a_message) => {
                  if (!a_message.test)
                    return;
                  if (a_message.command == "start_test") {
                    clearTimeout(timer);
                    timer = setTimeout(()=>{
                      complete = true;
                      a_act.error(new Error(`[${a_message.part}][${a_message.group}][${a_message.test}] test timed out`));
                    }, this._task.options.timeout);
                    this._task.currentTestInfo = {
                      part:      a_message.part,
                      group:     a_message.group,
                      test:      a_message.test,
                      executor:  commandInfo.command,
                      status:    undefined,
                      error:     undefined,
                      output:    [],
                    };
                  } else if (a_message.command == "end_test" && this._task.currentTestInfo) {
                    clearTimeout(timer);
                    timer = setTimeout(()=>{
                      complete = true;
                      a_act.error(new Error("Browser command timed out"));
                    }, this._task.options.timeout);
                    this._task.currentTestInfo.status = a_message.error ? "error" : "ok";
                    this._task.currentTestInfo.error  = a_message.error;
                    this._task.result.tests.push(this._task.currentTestInfo);
                    if (this._task.currentTestInfo.status == "error") {
                      ++this._task.result.errorCount;
                    } else {
                      ++this._task.result.successfulCount;
                    }
                    ++this._task.result.testCount;
                    this._task.currentTestInfo = undefined;
                  }
                  this._msg(commandInfo.command, a_message);
                });

                this._log(`Start browser '${lastCommand}' ...`);
                process = libChildProcess.spawn(commandInfo.command, commandInfo.args);
                process.on("error", (a_error)=>{
                  clearTimeout(timer);
                  this._err(`Failed start browser 2'${lastCommand}'`);
                  a_act.error(new Error(`browser '${lastCommand}' exited with an error.`));
                });
                clearTimeout(timer);
                timer = setTimeout(()=>{
                  complete = true;
                  a_act.error(new Error(`Page "${url}" test timed out`));
                }, this._task.options.timeout);
              })
              .finally(()=>{
                if (process){
                  process.kill();
                }
                if (timer) {
                  clearTimeout(timer);
                  timer = undefined;
                }
              })
              .then(()=>{
                complete = true;
              });
            } catch(e) {
              lastError = e;
            }
            if (complete)
              break;
          }
          if (lastError) {
            throw new fcf.Exception("UNITEST_FAILD_BROWSER_TEST", {command: lastCommand, error: lastError});
          }
        })
        .finally(()=>{
          backServer.stop();
          for(let process of processes) {
            try {
              process.kill();
            } catch(e) {
            }
          }
        });
      }



      async _startTests() {
        var self = this;

        this._task.originLog = console.log;
        console.log = function(){
          if (!self._task.selfOutput){
            self._task.pushOutput("server", "log", "", {}, arguments);
          }
          self._task.originLog.apply(console, arguments);
        };
        this._task.originWarn = console.warn;
        console.warn = function(){
          if (!self._task.selfOutput){
            self._task.pushOutput("server", "warning", "", {}, arguments);
          }
          self._task.originWarn.apply(console, arguments);
        };
        this._task.originError = console.error;
        console.error = function(){
          if (!self._task.selfOutput){
            self._task.pushOutput("server", "error", "", {}, arguments);
          }
          self._task.originError.apply(console, arguments);
        };

        this._task.logEventHandlerBefore = function(a_info){
          if (!self._task.selfOutput){
            self._task.selfLoggerOutput = true;
            self._task.selfOutput = true;
          }
        };
        fcf.log.on("message_before", this._task.logEventHandlerBefore);


        this._task.logEventHandlerAfter = function(a_info){
          if (!self._task.selfOutput || self._task.selfLoggerOutput){
            self._task.pushOutput("server", a_info.level, a_info.module, {}, a_info.args);
          }
          if (self._task.selfOutput && self._task.selfLoggerOutput){
            self._task.selfLoggerOutput = false;
            self._task.selfOutput = false;
          }
        };
        fcf.log.on("message_after", this._task.logEventHandlerAfter);
      }



      _endTests() {
        if (this._task.originLog)
          console.log = this._task.originLog;
        if (this._task.originWarn)
          console.warn = this._task.originWarn;
        if (this._task.originError)
          console.error = this._task.originError;
        fcf.log.detach(this._task.logEventHandlerBefore);
        fcf.log.detach(this._task.logEventHandlerAfter);
      }



      _logTestsStart(a_parts, a_groups, a_tests) {
        this._log("====================================================")
        this._log(`Start testing${fcf.isServer() ? " on the server side..." : ""}`)
        this._log(`Parts:  ${a_parts ? a_parts.join("; ") : "*"}`);
        this._log(`Groups: ${a_groups ? a_groups.join("; ") : "*"}`);
        this._log(`Tests:  ${a_tests ? a_tests.join("; ") : "*"}`);
      }



      _logTestsEnd() {
        let errorTests = this._task.result.tests
                         .filter((test)=>{ return !!test.error })
                         .map((test)=>{ return `Executor ${test.executor}:  [${test.part}][${test.group}][${test.test}]`; })
                         .join(";\n");
        this._log("");
        this._log("----------------------------------------------------");
        this._log(`${this._task.result.testCount} test${this._task.result.testCount > 1 ? "s" : ""} have been completed.`);
        this._log(`Errors: ${this._task.result.errorCount}; Successfully: ${this._task.result.successfulCount}; Total: ${this._task.result.testCount}`);
        if (errorTests)
          this._log(`Tests that failed: \n${errorTests}`);
      }



      _msg(a_browser, a_message) {
        this._task.selfOutput = true;
        this._task.pushOutput(a_browser, a_message.level, a_message.source, {}, [a_message.message]);
        if (!this._task.options.quiet) {
          fcf.log.log.apply(fcf.log, fcf.append([`${a_message.source}; BROWSER:${a_browser}`], [a_message.message]));
        }
        this._task.selfOutput = false;
      }



      _log() {
        this._task.selfOutput = true;
        this._task.pushOutput("server", "log", "UniTest", {}, arguments);
        if (!this._task.options.quiet)
          fcf.log.log.apply(fcf.log, fcf.append(["UniTest"], arguments));
        this._task.selfOutput = false;
      }



      _logEx() {
        let args   = fcf.append([], arguments);
        let exdata = args.shift();
        this._task.selfOutput = true;
        this._task.pushOutput("server", "log", "UniTest", exdata, args);
        if (!this._task.options.quiet)
          fcf.log.log.apply(fcf.log, fcf.append(["UniTest"], args));
        this._task.selfOutput = false;
      }



      _err() {
        this._task.selfOutput = true;
        this._task.pushOutput("server", "error", "UniTest", {}, arguments);
        if (!this._task.options.quiet)
          fcf.log.err.apply(fcf.log, fcf.append(["UniTest"], arguments));
        this._task.selfOutput = false;
      }



      _errEx() {
        let args   = fcf.append([], arguments);
        let exdata = args.shift();
        this._task.selfOutput = true;
        this._task.pushOutput("server", "error", "UniTest", exdata, args);
        if (!this._task.options.quiet)
          fcf.log.log.apply(fcf.log, fcf.append(["UniTest"], args));
        this._task.selfOutput = false;
      }



      _getErrorInfo(a_exception) {
        let stack = fcf.parseStack(a_exception);
        let stackItem = stack.find((itm)=>{
          if (!itm.function || !itm.file)
            return true;
          return itm.function && itm.function.indexOf("Namespace.Unitest.") != 0 &&
                 itm.file.indexOf("fcf-framework-unitest/unitest.js") == -1 &&
                 !(itm.function.indexOf("Exception") != -1 && itm.file.indexOf("/fcf.js") != -1)
                 ;
        });
        return {
          message: fcf.str(a_exception),
          error:   a_exception,
          file:    stackItem ? stackItem.file : "unknown",
          line:    stackItem ? stackItem.line : "unknown",
        }
      }



      _quantityToOptionArray(a_value) {
        return Array.isArray(a_value)     ? a_value :
               typeof a_value == "string" ? a_value.split(";") :
                                            false;
      }



      _isSelected(a_value, a_quantity) {
        a_value    = this._quantityToOptionArray(a_value);
        a_quantity = this._quantityToOptionArray(a_quantity);
        if (!a_quantity || !a_value) {
          return true;
        }
        let found = false;
        for(let itm of a_value) {
          if (a_quantity.indexOf(itm) != -1){
            found = true;
            break;
          }
        }
        return found;
      }

    };

    Namespace["unitest"] = new Namespace["Unitest"]();

    return Namespace["unitest"];
  }
});
