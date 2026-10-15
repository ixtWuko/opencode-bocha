import type { Plugin } from "@opencode/plugin";
declare const plugin: {
    id: string;
    setup(ctx: Plugin.Context): Promise<void>;
};
export default plugin;
