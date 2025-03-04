import {
	type FunctionDeclaration as TSFunctionDeclaration,
	type SourceFile as TSSourceFile
} from "typescript"

import {getJSDocAsStringFromNode} from "./getJSDocAsStringFromNode.mts"
import type {FunctionDeclaration} from "./FunctionDeclaration.d.mts"

export function convertFunctionDeclaration(
	fn: TSFunctionDeclaration
) : FunctionDeclaration {
	const source : TSSourceFile = fn.getSourceFile()

	const function_name : string|null = fn.name ? fn.name.getText(source) : null

	const modifiers : string[] = fn.modifiers ? fn.modifiers.map(modifier => {
		return modifier.getText(source).toLowerCase()
	}) : []

	const type_params : FunctionDeclaration["type_params"] = []

	if (fn.typeParameters) {
		for (const type_param of fn.typeParameters) {
			type_params.push({
				name: type_param.name.getText(source),
				definition: type_param.getText(source)
			})
		}
	}

	const params : FunctionDeclaration["params"] = []

	if (fn.parameters) {
		for (const param of fn.parameters) {
			const name : string = param.name.getText(source)
			const type : string = param.type ? param.type.getText(source) : "any"
			const optional = param.questionToken !== undefined
			const question_mark = optional ? "?" : ""

			params.push({
				name,
				type,
				jsdoc: getJSDocAsStringFromNode(param),
				definition: `${name}${question_mark}: ${type}`,
				optional
			})
		}
	}

	let return_type : string = modifiers.includes("async") ? "Promise<any>" : "any"

	if (fn.type) {
		return_type = fn.type.getText(source)
	}

	return {
		name: function_name,

		jsdoc: getJSDocAsStringFromNode(fn),
		modifiers,

		type_params,

		params,

		return_type
	}
}
