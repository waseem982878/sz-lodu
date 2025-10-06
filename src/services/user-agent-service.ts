import { UAParser } from 'ua-parser-js';

class UserAgentService {
  private parser: UAParser;

  constructor(userAgent: string) {
    this.parser = new UAParser(userAgent);
  }

  getBrowser() {
    return this.parser.getBrowser();
  }

  getDevice() {
    return this.parser.getDevice();
  }

  getOS() {
    return this.parser.getOS();
  }
}

export default UserAgentService;
