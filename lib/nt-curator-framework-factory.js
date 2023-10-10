"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NtCuratorFrameworkFactory = void 0;
const nt_curator_framework_1 = require("./nt-curator-framework");
class NtCuratorFrameworkFactory {
    static createClient(...params) {
        return new nt_curator_framework_1.NtCuratorFramework(...params);
    }
}
exports.NtCuratorFrameworkFactory = NtCuratorFrameworkFactory;
