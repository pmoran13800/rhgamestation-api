import solfege from "solfegejs";
import Stream from "stream";
import js2xmlparser from "js2xmlparser";
import controllersPackage from "./controllers"

/**
 * The API bundle
 *
 * @class   Api
 */
export default class Api
{
    /**
     * Constructor
     */
    constructor()
    {
        // The controllers package
        this.controllers = controllersPackage;

        // Initialize the configuration
        this._configuration = {
            mainConfigurationFilePath: "/rhgamestation/share/system/rhgamestation.conf",
            biosDirectoryPath: "/rhgamestation/share/bios",
            romsDirectoryPath: "/rhgamestation/share/roms"
        };
    }

    /**
     * The configuration
     *
     * @public
     * @member  {Object}
     */
    get configuration()
    {
        return this._configuration;
    }


    /**
     * Override the configuration of the bundles
     *
     * @public
     * @param   {Object}    configuration   The configuration object
     */
    *overrideConfiguration(configuration)
    {
        this._configuration = configuration;
    }


    /**
     * Format the response
     *
     * @public
     * @param   {solfege.bundle.server.Request}     request     The request
     * @param   {solfege.bundle.server.Response}    response    The response
     * @param   {GeneratorFunction}                 next        The next function
     */
    *formatMiddleware(request, response, next)
    {
        request.configuration = this.configuration;

        // Execute the next middleware
        yield *next;

        // Allow cross domain access
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Expose-Headers", "Content-Range, Accept-Range");
        let allowMethods = response.getHeader("Access-Control-Allow-Methods");
        if (!allowMethods) {
            response.setHeader("Access-Control-Allow-Methods", "GET, HEAD, PUT, POST, OPTIONS");
        }

        // The request is a verification
        if (request.method === "OPTIONS") {
            response.statusCode = 200;
            response.body = "";
            return;
        }

        // The body is a Stream. There is no need to format the output
        if (response.body instanceof Stream) {
            return;
        }

        // If the body and the parameters are empty,
        // then it means that the URL doesn't exist
        // @todo Use a feature of the router to do that
        if (!response.body && 
            (
                !response.parameters || 
                Object.keys(response.parameters).length === 0
            ) 
        ) {
            response.statusCode = 404;
            response.parameters = {
                error: "Not found"
            };
        }

        // Convert the body to the requested format
        switch (request.acceptsTypes("json", "xml", "text")) {
            // JSON key values
            case "json":
                response.setHeader("Content-Type", "application/json");
                response.body = JSON.stringify(response.parameters, null, "    ");
                break;

            // XML key values
            case "xml":
                response.setHeader("Content-Type", "application/xml");

                let body;
                if (Array.isArray(response.parameters)) {
                    body = js2xmlparser("response", {item: response.parameters});
                } else {
                    body = js2xmlparser("response", response.parameters);
                }
                /*
                let body = `<?xml version="1.0" encoding="UTF-8" ?>\n<response>\n`;
                for (let key in response.parameters) {
                    let value = response.parameters[key];
                    body += `<${key}>`;
                    if (!isNaN(value)) {
                        body += value;
                    } else {
                        body += `<![CDATA[${value}]]>`;
                    }
                    body += `</${key}>\n`;
                }
                body += `</response>`;
                */
                response.body = body;
                break;

            // Plain text
            default:
            case "text":
                response.setHeader("Content-Type", "text/plain");

                // If the body is empty, then use the parameters
                if (!response.body && response.parameters) {
                    let body = "";
                    for (let key in response.parameters) {
                        let value = response.parameters[key];
                        if (value instanceof Object) {
                            for (let valueKey in value) {
                                value = value[valueKey];
                                break;
                            }
                        }

                        body += `${key}=${value}\n`;
                    }
                    response.body = body;
                }
                break;
        }

    }
}
