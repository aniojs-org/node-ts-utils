import ts from "typescript"
import type {Transformer} from "./Transformer.d.mts"
import {printNode} from "./printNode.mts"
import {copyComments} from "#~src/copyComments.mts"

type Mapper = (
	moduleSpecifier: string,
	declaration: ts.ImportDeclaration | ts.ExportDeclaration,
	remove: () => symbol
) => string|undefined|symbol

export function remapModuleImportAndExportSpecifiers(
	mapper: Mapper
): Transformer {
	return (oldNode, {factory}) => {
		if (
		    !ts.isImportDeclaration(oldNode) &&
		    !ts.isExportDeclaration(oldNode)
		   ) {
			return oldNode
		}

		if (!oldNode.moduleSpecifier) return oldNode

		// todo: i think this includes comments :-/
		const defaultModuleSpecifier = printNode(oldNode.moduleSpecifier).slice(1, -1)
		const removeSymbol = Symbol()
		const mapperResult = mapper(defaultModuleSpecifier, oldNode, () => {
			return removeSymbol
		})

		if (typeof mapperResult === "symbol") {
			if (mapperResult === removeSymbol) {
				return []
			} else {
				throw new Error(`mapper returned unknown symbol.`)
			}
		}

		const newModuleSpecifier = factory.createStringLiteral(
			mapperResult ?? defaultModuleSpecifier
		)

		if (ts.isImportDeclaration(oldNode)) {
			return copyComments(oldNode, factory.createImportDeclaration(
				oldNode.modifiers,
				oldNode.importClause,
				newModuleSpecifier,
				oldNode.attributes
			))
		}

		return copyComments(oldNode, factory.createExportDeclaration(
			oldNode.modifiers,
			oldNode.isTypeOnly,
			oldNode.exportClause,
			newModuleSpecifier,
			oldNode.attributes
		))
	}
}
