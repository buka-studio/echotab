import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  MenuTextMatch,
  useBasicTypeaheadTriggerMatch,
} from "@lexical/react/LexicalTypeaheadMenuPlugin";
import { $nodesOfType, TextNode } from "lexical";
import { createContext, JSX, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "../../util";
import { $createMentionNode, MentionNode } from "./MentionNode";

const PUNCTUATION = "\\.,\\+\\*\\?\\$\\@\\|#{}\\(\\)\\^\\-\\[\\]\\\\/!%'\"~=<>_:;";
const NAME = "\\b[A-Z][^\\s" + PUNCTUATION + "]";

const DocumentMentionsRegex = {
  NAME,
  PUNCTUATION,
};

const PUNC = DocumentMentionsRegex.PUNCTUATION;

const TRIGGERS = ["@"].join("");

// Chars we expect to see in a mention (non-space, non-punctuation).
const VALID_CHARS = "[^" + TRIGGERS + PUNC + "\\s]";

// Non-standard series of chars. Each series must be preceded and followed by
// a valid char.
const VALID_JOINS =
  "(?:" +
  "\\.[ |$]|" + // E.g. "r. " in "Mr. Smith"
  " |" + // E.g. " " in "Josh Duck"
  "[" +
  PUNC +
  "]|" + // E.g. "-' in "Salier-Hellendag"
  ")";

const LENGTH_LIMIT = 75;

const AtSignMentionsRegex = new RegExp(
  "(^|\\s|\\()(" +
  "[" +
  TRIGGERS +
  "]" +
  "((?:" +
  VALID_CHARS +
  VALID_JOINS +
  "){0," +
  LENGTH_LIMIT +
  "})" +
  ")$",
);

// 50 is the longest alias length limit.
const ALIAS_LENGTH_LIMIT = 50;

// Regex used to match alias.
const AtSignMentionsRegexAliasRegex = new RegExp(
  "(^|\\s|\\()(" +
  "[" +
  TRIGGERS +
  "]" +
  "((?:" +
  VALID_CHARS +
  "){0," +
  ALIAS_LENGTH_LIMIT +
  "})" +
  ")$",
);

// At most, 5 suggestions are shown in the popup.
const SUGGESTION_LIST_LENGTH_LIMIT = 5;

const mentionsCache = new Map();

interface Option {
  value: string;
  label: string;
  hint?: string;
}

const MentionsLookupServiceContext = createContext({
  search: (string: string, callback: (results: Option[]) => void): void => { },
});
export function MentionsLookupServiceProvider({
  children,
  service,
}: {
  children: React.ReactNode;
  service: { search: (string: string, callback: (results: Option[]) => void) => void };
}) {
  return (
    <MentionsLookupServiceContext.Provider value={service}>
      {children}
    </MentionsLookupServiceContext.Provider>
  );
}

function useMentionLookupService(mentionString: string | null) {
  const [results, setResults] = useState<Option[]>([]);
  const lookupService = useContext(MentionsLookupServiceContext);

  useEffect(() => {
    const cachedResults = mentionsCache.get(mentionString);

    if (mentionString == null) {
      setResults([]);
      return;
    }

    if (cachedResults === null) {
      return;
    } else if (cachedResults !== undefined) {
      setResults(cachedResults);
      return;
    }

    mentionsCache.set(mentionString, null);
    lookupService.search(mentionString, (newResults) => {
      mentionsCache.set(mentionString, newResults);
      setResults(newResults);
    });
  }, [mentionString]);

  return results;
}

function checkForAtSignMentions(text: string, minMatchLength: number): MenuTextMatch | null {
  let match = AtSignMentionsRegex.exec(text);

  if (match === null) {
    match = AtSignMentionsRegexAliasRegex.exec(text);
  }
  if (match !== null) {
    // The strategy ignores leading whitespace but we need to know it's
    // length to add it to the leadOffset
    const maybeLeadingWhitespace = match[1]!;

    const matchingString = match[3]!;
    if (matchingString.length >= minMatchLength) {
      return {
        leadOffset: match.index + maybeLeadingWhitespace.length,
        matchingString,
        replaceableString: match[2]!,
      };
    }
  }
  return null;
}

function getPossibleQueryMatch(text: string): MenuTextMatch | null {
  return checkForAtSignMentions(text, 1);
}

class MentionTypeaheadOption extends MenuOption {
  constructor(
    public value: string,
    public label: string,
    public hint?: string,
  ) {
    super(value);
  }
}

interface ItemProps {
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  option: MentionTypeaheadOption;
}

function MentionsTypeaheadMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  option,
  className,
}: ItemProps & { className?: string }) {
  return (
    <li
      key={option.key}
      tabIndex={-1}
      className={cn(
        "item data-[highlighted=true]:bg-accent data-[highlighted=true]:text-accent-foreground relative cursor-default select-none items-center gap-1 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        { selected: isSelected },
        className,
      )}
      data-highlighted={isSelected}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      id={"typeahead-item-" + index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}>
      <span className="text block overflow-hidden text-ellipsis">{option.label}</span>
      {option.hint && (
        <span className="hint text-muted-foreground block overflow-hidden text-ellipsis text-xs">
          {option.hint}
        </span>
      )}
    </li>
  );
}

interface Props {
  onMentionsChange?: (mentions: string[]) => void;
}

export default function MentionsPlugin({ onMentionsChange }: Props): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  const [queryString, setQueryString] = useState<string | null>(null);

  const results = useMentionLookupService(queryString);

  const checkForSlashTriggerMatch = useBasicTypeaheadTriggerMatch("/", {
    minLength: 0,
  });

  const options = useMemo(
    () =>
      results
        .map((result) => new MentionTypeaheadOption(result.value, result.label, result.hint))
        .slice(0, SUGGESTION_LIST_LENGTH_LIMIT),
    [results],
  );

  const onSelectOption = useCallback(
    (
      selectedOption: MentionTypeaheadOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(
        () => {
          const mentionNode = $createMentionNode(selectedOption.value, selectedOption.label);
          if (nodeToReplace) {
            nodeToReplace.replace(mentionNode);
          }
          mentionNode.select();
          closeMenu();
        },
        {
          onUpdate: () => {
            editor.getEditorState().read(() => {
              const mentions = $nodesOfType(MentionNode).map((node) => node.__mention);
              onMentionsChange?.(mentions);
            });
          },
        },
      );
    },
    [editor],
  );

  const checkForMentionMatch = useCallback(
    (text: string) => {
      const slashMatch = checkForSlashTriggerMatch(text, editor);
      if (slashMatch !== null) {
        return null;
      }
      return getPossibleQueryMatch(text);
    },
    [checkForSlashTriggerMatch, editor],
  );

  return (
    <LexicalTypeaheadMenuPlugin<MentionTypeaheadOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForMentionMatch}
      options={options}
      anchorClassName="z-50"
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) =>
        anchorElementRef.current && results.length
          ? createPortal(
            <div className="typeahead-popover mentions-menu pointer-events-auto">
              <ul
                className={cn(
                  "bg-popover text-popover-foreground z-50 min-w-fit max-w-sm overflow-hidden rounded-md border p-1 shadow-md",
                )}>
                {options.map((option, i: number) => (
                  <MentionsTypeaheadMenuItem
                    index={i}
                    isSelected={selectedIndex === i}
                    onClick={() => {
                      setHighlightedIndex(i);
                      selectOptionAndCleanUp(option);
                    }}
                    onMouseEnter={() => {
                      setHighlightedIndex(i);
                    }}
                    key={option.key}
                    option={option}
                    className="max-w-sm text-ellipsis whitespace-nowrap"
                  />
                ))}
              </ul>
            </div>,
            anchorElementRef.current,
          )
          : null
      }
    />
  );
}
