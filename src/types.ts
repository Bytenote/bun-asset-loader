export type Asset = {
	from: string;
	to: string;
	name?: string;
	filter?: string | RegExp;
	transform?: (content: string) => string;
	minify?: boolean;
};

export type Options = {
	assets: Asset[];
};
