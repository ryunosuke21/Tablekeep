"use client";

import type { ItemInstance, TreeInstance } from "@headless-tree/core";
import { cn } from "@tablekeep/ui/lib/utils";
import { IconChevronDown, IconMinus, IconPlus } from "@tabler/icons-react";
import { Slot } from "radix-ui";
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
} from "react";
import { createContext, useContext } from "react";

type ToggleIconType = "chevron" | "plus-minus";

interface TreeContextValue<T = unknown> {
  indent: number;
  currentItem?: ItemInstance<T>;
  tree?: TreeInstance<T>;
  toggleIconType?: ToggleIconType;
}

const TreeContext = createContext<TreeContextValue>({
  indent: 20,
  currentItem: undefined,
  tree: undefined,
  toggleIconType: "plus-minus",
});

function useTreeContext<T = unknown>() {
  return useContext(TreeContext) as TreeContextValue<T>;
}

interface TreeProps<T = unknown> extends HTMLAttributes<HTMLDivElement> {
  indent?: number;
  tree?: TreeInstance<T>;
  toggleIconType?: ToggleIconType;
  asChild?: boolean;
}

function Tree<T = unknown>({
  indent = 20,
  tree,
  className,
  toggleIconType = "chevron",
  asChild = false,
  ...props
}: TreeProps<T>) {
  const containerProps = tree?.getContainerProps() ?? {};
  const mergedProps = { ...props, ...containerProps };

  // Extract style from mergedProps to merge with our custom styles
  const { style: propStyle, ...otherProps } = mergedProps;

  // Merge styles
  const mergedStyle = {
    ...propStyle,
    "--tree-indent": `${indent}px`,
  } as CSSProperties;

  const Comp = asChild ? Slot.Root : "div";

  return (
    <TreeContext.Provider
      value={{ indent, tree, toggleIconType } as unknown as TreeContextValue}
    >
      <Comp
        data-slot="tree"
        style={mergedStyle}
        className={cn("flex flex-col", className)}
        {...otherProps}
      />
    </TreeContext.Provider>
  );
}

interface TreeItemProps<T = unknown>
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "indent"> {
  item: ItemInstance<T>;
  indent?: number;
  asChild?: boolean;
}

function TreeItem<T = unknown>({
  item,
  className,
  asChild = false,
  children,
  ...props
}: TreeItemProps<T>) {
  const parentContext = useTreeContext<T>();
  const { indent } = parentContext;

  const itemProps = item.getProps();
  const mergedProps = { ...props, children, ...itemProps };

  // Extract style from mergedProps to merge with our custom styles
  const { style: propStyle, ...otherProps } = mergedProps;

  // Merge styles
  const mergedStyle = {
    ...propStyle,
    "--tree-padding": `${item.getItemMeta().level * indent}px`,
  } as CSSProperties;

  const defaultProps = {
    "data-slot": "tree-item",
    style: mergedStyle,
    className: cn(
      "z-10 select-none ps-(--tree-padding) not-last:pb-0.5 outline-hidden focus:z-20 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    ),
    "data-focus":
      typeof item.isFocused === "function"
        ? item.isFocused() || false
        : undefined,
    "data-folder":
      typeof item.isFolder === "function"
        ? item.isFolder() || false
        : undefined,
    "data-selected":
      typeof item.isSelected === "function"
        ? item.isSelected() || false
        : undefined,
    "data-drag-target":
      typeof item.isDragTarget === "function"
        ? item.isDragTarget() || false
        : undefined,
    "data-search-match":
      typeof item.isMatchingSearch === "function"
        ? item.isMatchingSearch() || false
        : undefined,
    "aria-expanded": item.isExpanded(),
  };

  const Comp = asChild ? Slot.Root : "button";

  return (
    <TreeContext.Provider
      value={
        { ...parentContext, currentItem: item } as unknown as TreeContextValue
      }
    >
      <Comp {...defaultProps} {...otherProps}>
        {children}
      </Comp>
    </TreeContext.Provider>
  );
}

interface TreeItemLabelProps<T = unknown>
  extends HTMLAttributes<HTMLSpanElement> {
  item?: ItemInstance<T>;
  asChild?: boolean;
}

function TreeItemLabel<T = unknown>({
  item: propItem,
  children,
  className,
  asChild = false,
  ...props
}: TreeItemLabelProps<T>) {
  const { currentItem, toggleIconType } = useTreeContext<T>();
  const item = propItem || currentItem;

  if (!item) return null;

  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="tree-item-label"
      className={cn(
        "flex items-center gap-1 bg-background in-data-[drag-target=true]:bg-accent in-data-[search-match=true]:bg-blue-50! in-data-[selected=true]:bg-accent not-in-data-[folder=true]:ps-7 in-data-[selected=true]:text-accent-foreground in-focus-visible:ring-[3px] in-focus-visible:ring-ring/50 transition-colors hover:bg-accent [&_svg]:pointer-events-none [&_svg]:shrink-0",
        "rounded-md",
        "py-1.5",
        "px-2",
        "text-sm",
        className,
      )}
      {...props}
    >
      {item.isFolder() &&
        (toggleIconType === "plus-minus" ? (
          item.isExpanded() ? (
            <IconMinus
              className="size-3.5 text-muted-foreground"
              stroke="currentColor"
              strokeWidth="1"
            />
          ) : (
            <IconPlus
              className="size-3.5 text-muted-foreground"
              stroke="currentColor"
              strokeWidth="1"
            />
          )
        ) : (
          <IconChevronDown className="size-4 in-aria-[expanded=false]:-rotate-90 text-muted-foreground" />
        ))}
      {children || item.getItemName()}
    </Comp>
  );
}

function TreeDragLine({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { tree } = useTreeContext();

  if (!tree) return null;

  const dragLine = tree.getDragLineStyle();
  return (
    <div
      style={dragLine}
      className={cn(
        "absolute z-30 -mt-px h-0.5 w-[unset] bg-primary before:absolute before:-top-[3px] before:left-0 before:size-2 before:border-2 before:border-primary before:bg-background",
        "before:rounded-full",
        className,
      )}
      {...props}
    />
  );
}

export { Tree, TreeDragLine, TreeItem, TreeItemLabel };
