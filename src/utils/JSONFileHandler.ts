/**
 * A utility class for reading and writing JSON files in ExtendScript.
 */
class JSONFileHandler {
    private file: File;
    private fileName:string;

    /**
     * Creates an instance of JSONFileHandler.
     * @param {string} filePath - The path to the JSON file.
     */
    constructor(filePath: string = "C:\\Users\\Admin\\Documents\\jft.conf") {
        this.file = new File(filePath);
        const fileNameArr = filePath.split("\\")
        this.fileName = fileNameArr[fileNameArr.length-1];
    }

    /**
     * Reads and parses the JSON file.
     * @returns {object | null} The parsed JSON object, or null if an error occurs.
     */
    read(): object | null {
        if (!this.file.exists) {
            alertDialogSA(`${this.fileName} File does not exist.`);
            return null;
        }

        if (this.file.open("r")) {
            try {
                const content = this.file.read();
                this.file.close();
                return JSONSA.parse(content);
            } catch (error) {
                alertDialogSA(`Error reading ${this.fileName} file`);
                return null;
            }
        } else {
            alertDialogSA(`Unable to open ${this.fileName} file for reading.`);
            return null;
        }
    }

    /**
     * Writes an object to the JSON file.
     * @param {object} data - The JSON data to write.
     * @returns {boolean} True if the write operation succeeds, false otherwise.
     */
    write(data: object): boolean {
        if (this.file.open("w")) {
            try {
                this.file.write(JSONSA.stringify(data));
                this.file.close();
                return true;
            } catch (error) {
                $.writeln(`Error writing ${this.fileName} file`);
                return false;
            }
        } else {
            $.writeln(`Unable to open ${this.fileName} file for writing.`);
            return false;
        }
    }
}
