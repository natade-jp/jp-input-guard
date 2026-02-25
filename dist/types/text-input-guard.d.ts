/**
 * 指定した1要素に対してガードを適用し、Guard API を返す
 * @param {HTMLInputElement|HTMLTextAreaElement} element
 * @param {AttachOptions} [options]
 * @returns {Guard}
 */
declare function attach(element: HTMLInputElement | HTMLTextAreaElement, options?: AttachOptions): Guard;
/**
 * @typedef {Object} GuardGroup
 * @property {() => void} detach - 全部 detach
 * @property {() => boolean} isValid - 全部 valid なら true
 * @property {() => TigError[]} getErrors - 全部のエラーを集約
 * @property {() => Guard[]} getGuards - 個別Guard配列
 */
/**
 * @param {Iterable<HTMLInputElement|HTMLTextAreaElement>} elements
 * @param {AttachOptions} [options]
 * @returns {GuardGroup}
 */
declare function attachAll(elements: Iterable<HTMLInputElement | HTMLTextAreaElement>, options?: AttachOptions): GuardGroup;
type GuardGroup = {
    /**
     * - 全部 detach
     */
    detach: () => void;
    /**
     * - 全部 valid なら true
     */
    isValid: () => boolean;
    /**
     * - 全部のエラーを集約
     */
    getErrors: () => TigError[];
    /**
     * - 個別Guard配列
     */
    getGuards: () => Guard[];
};
/**
 * 対象要素の種別（現在は input と textarea のみ対応）
 */
type ElementKind = "input" | "textarea";
/**
 * ルール実行フェーズ名（パイプラインの固定順）
 * normalize.char → normalize.structure → validate → fix → format
 */
type PhaseName = "normalize.char" | "normalize.structure" | "validate" | "fix" | "format";
/**
 * バリデーションエラー情報を表すオブジェクト
 */
type TigError = {
    /**
     * - エラー識別子（例: "digits.int_overflow"）
     */
    code: string;
    /**
     * - エラーを発生させたルール名
     */
    rule: string;
    /**
     * - 発生したフェーズ
     */
    phase: PhaseName;
    /**
     * - 追加情報（制限値など）
     */
    detail?: any;
};
/**
 * setValue で設定できる値型
 * - number は String に変換して設定する
 * - null/undefined は空文字として扱う
 */
type SetValueInput = string | number | null | undefined;
/**
 * setValue 実行モード
 * - "commit"  確定評価まで実行 normalize→validate→fix→format
 * - "input"   入力中評価のみ実行 normalize→validate
 * - "none"    評価は実行しない 値だけを反映
 *
 * 既定値は "commit"
 */
type SetValueMode = "none" | "input" | "commit";
/**
 * attach() が返す公開API（利用者が触れる最小インターフェース）
 */
type Guard = {
    /**
     * - ガード解除（イベント削除・swap復元）
     */
    detach: () => void;
    /**
     * - 現在エラーが無いかどうか
     */
    isValid: () => boolean;
    /**
     * - エラー一覧を取得
     */
    getErrors: () => TigError[];
    /**
     * - 送信用の正規化済み値を取得
     */
    getRawValue: () => string;
    /**
     * - ユーザーが実際に操作している要素の値を取得
     */
    getDisplayValue: () => string;
    /**
     * - 送信用の正規化済み値の要素
     */
    getRawElement: () => HTMLInputElement | HTMLTextAreaElement;
    /**
     * - ユーザーが実際に操作している要素（swap時はdisplay専用）
     */
    getDisplayElement: () => HTMLInputElement | HTMLTextAreaElement;
    /**
     * 入力中評価を手動実行 normalize→validate
     */
    evaluate: () => void;
    /**
     * 確定評価を手動実行 normalize→validate→fix→format
     */
    commit: () => void;
    setValue: (value: SetValueInput, mode?: SetValueMode) => void;
};
/**
 * 各ルールに渡される実行コンテキスト
 * - DOM参照や状態、エラー登録用関数などをまとめたもの
 */
type GuardContext = {
    /**
     * - 元の要素（swap時はraw側）
     */
    hostElement: HTMLElement;
    /**
     * - ユーザーが操作する表示要素
     */
    displayElement: HTMLElement;
    /**
     * - 送信用hidden要素（swap時のみ）
     */
    rawElement: HTMLInputElement | null;
    /**
     * - 要素種別（input / textarea）
     */
    kind: ElementKind;
    /**
     * - warnログを出すかどうか
     */
    warn: boolean;
    /**
     * - エラー時に付与するclass名
     */
    invalidClass: string;
    /**
     * - IME変換中かどうか
     */
    composing: boolean;
    /**
     * - エラーを登録する関数
     */
    pushError: (e: TigError) => void;
    /**
     * - 入力を直前の受理値へ巻き戻す要求
     */
    requestRevert: (req: RevertRequest) => void;
};
/**
 * 1つの入力制御ルール定義
 * - 各フェーズの処理を必要に応じて実装する
 */
type Rule = {
    /**
     * - ルール名（識別用）
     */
    name: string;
    /**
     * - 適用可能な要素種別
     */
    targets: ("input" | "textarea")[];
    /**
     * - 文字単位の正規化（全角→半角など）
     */
    normalizeChar?: (value: string, ctx: GuardContext) => string;
    /**
     * - 構造の正規化（-位置修正など）
     */
    normalizeStructure?: (value: string, ctx: GuardContext) => string;
    /**
     * - エラー判定（値は変更しない）
     */
    validate?: (value: string, ctx: GuardContext) => void;
    /**
     * - 確定時の穏やか補正（切り捨て等）
     */
    fix?: (value: string, ctx: GuardContext) => string;
    /**
     * - 表示整形（カンマ付与など）
     */
    format?: (value: string, ctx: GuardContext) => string;
};
/**
 * 表示値(display)と内部値(raw)の分離設定
 */
type SeparateValueOptions = {
    /**
     * - "auto": format系ルールがある場合のみ自動でswapする（既定）
     * - "swap": 常にswapする（inputのみ対応）
     * - "off": 分離しない（displayとrawを同一に扱う）
     */
    mode?: "auto" | "swap" | "off";
};
/**
 * attach() に渡す設定オプション
 */
type AttachOptions = {
    /**
     * - 適用するルール配列（順番がフェーズ内実行順になる）
     */
    rules?: Rule[];
    /**
     * - 非対応ルールなどを console.warn するか
     */
    warn?: boolean;
    /**
     * - エラー時に付けるclass名
     */
    invalidClass?: string;
    /**
     * - 表示値と内部値の分離設定
     */
    separateValue?: SeparateValueOptions;
};
/**
 * selection（カーソル/選択範囲）の退避情報
 */
type SelectionState = {
    /**
     * - selectionStart
     */
    start: number | null;
    /**
     * - selectionEnd
     */
    end: number | null;
    /**
     * - selectionDirection
     */
    direction: "forward" | "backward" | "none" | null;
};
/**
 * revert要求（入力を巻き戻す指示）
 */
type RevertRequest = {
    /**
     * - ルール名や理由（例: "digits.int_overflow"）
     */
    reason: string;
    /**
     * - デバッグ用の詳細
     */
    detail?: any;
};

export { attach, attachAll };
export type { AttachOptions, ElementKind, Guard, GuardContext, GuardGroup, PhaseName, RevertRequest, Rule, SelectionState, SeparateValueOptions, SetValueInput, SetValueMode, TigError };
