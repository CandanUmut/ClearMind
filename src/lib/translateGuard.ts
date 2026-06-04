// Browser page-translation (Google Translate / Chrome auto-translate) rewrites
// text nodes — wrapping them in <font> elements and moving them around. React
// keeps its own virtual-DOM view and, on the next update, calls removeChild /
// insertBefore on nodes whose real parent has changed, throwing NotFoundError
// and crashing the app (most visibly on screens with conditional text swaps,
// e.g. the second session block). This is a long-standing, well-known React
// issue (facebook/react#11538).
//
// The fix makes removeChild / insertBefore no-throw when the DOM has been moved
// out from under React: we fall back to operating on the node's actual parent,
// or no-op. Translation keeps working; React simply stops crashing.

export function installTranslationGuard(): void {
  if (typeof Node !== 'function' || !Node.prototype) return;
  if ((Node.prototype as { __cmGuarded?: boolean }).__cmGuarded) return;
  (Node.prototype as { __cmGuarded?: boolean }).__cmGuarded = true;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      // The node was moved/replaced by the translator. Remove it from wherever
      // it actually lives, or just hand it back so React can continue.
      if (child.parentNode) {
        try {
          return originalRemoveChild.call(child.parentNode, child) as T;
        } catch {
          return child;
        }
      }
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  } as typeof Node.prototype.removeChild;

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(
    this: Node,
    newNode: T,
    referenceNode: Node | null,
  ): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      // The reference node was moved by the translator; append instead of
      // inserting before a node that's no longer our child.
      try {
        return originalInsertBefore.call(this, newNode, null) as T;
      } catch {
        return newNode;
      }
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  } as typeof Node.prototype.insertBefore;
}
