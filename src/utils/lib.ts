// biome-ignore-all lint/suspicious/noExplicitAny: the mergeOptions function is very dynamic and we should use any

/**
 * Deeply merges two option objects, copying all enumerable properties from the source object into the target object.
 *
 * - If a key exists in both objects and both values are plain objects (not arrays), they are merged recursively.
 * - Arrays and non-object (primitive) values from the source will overwrite those in the target.
 * - The original objects are not mutated; a new merged object is returned.
 *
 * @param {TargetOptions} targetOptions
 * The options object whose properties will be overwritten, extended, or merged with properties from `sourceOptions`.
 * @param {SourceOptions} sourceOptions
 * The options object whose properties will overwrite, extend, or merge with `targetOptions`.
 *
 * @returns {TargetOptions & SourceOptions}
 * A new object representing a deep merge of `targetOptions` and `sourceOptions`.
 */
export function mergeOptions<
	TargetOptions extends Record<PropertyKey, any>,
	SourceOptions extends Record<PropertyKey, any>,
>(
	targetOptions: TargetOptions,
	sourceOptions: SourceOptions,
): TargetOptions & SourceOptions {
	const mergedOptions = structuredClone(targetOptions);

	for (const key of Object.keys(sourceOptions) as (keyof SourceOptions)[]) {
		const targetValue = targetOptions[key];
		const sourceValue = sourceOptions[key];
		let mergedValue = sourceValue;

		// Check if the key corresponds to a plain object (not an array) and exists in targetOptions.
		// If both conditions are met, recursively merge the nested objects.
		// Note: Arrays are replaced directly from the source rather than merged.
		if (
			isPlainObject(sourceValue) &&
			Object.hasOwn(targetOptions, key) &&
			isPlainObject(targetValue)
		) {
			mergedValue = mergeOptions(targetValue, sourceValue);
		}

		mergedOptions[key] = mergedValue;
	}

	return mergedOptions;
}

function isPlainObject(value: unknown): boolean {
	// Check if the value is not an object
	if (typeof value !== 'object' || value === null) return false;

	// Make sure it is a plain object and not Date for example
	const proto = Object.getPrototypeOf(value);
	return (
		Object.prototype.toString.call(value) === '[object Object]' &&
		(proto === Object.prototype || proto === null)
	);
}
