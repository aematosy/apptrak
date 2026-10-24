/**
 * PASO 3: Tipos del modelo normalizado
 * Basado en SDD 6.2: Modelo de nodo normalizado
 *
 * Cada elemento del árbol de UI (Android o iOS) se convierte a este modelo
 * agnóstico de plataforma.
 */

export interface Bounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface NodoNormalizado {
  // Identidad
  indice: number; // 0, 1, 2, ... secuencial por árbol
  padre: number | null; // indice del padre, null si es root
  clase: string; // ej: "android.widget.Button", "UIButton"

  // Locators estables (SDD 6.2: idEstable, descripcion)
  idEstable: string | null; // resource-id (Android) o name (iOS, si distinto de label)
  descripcion: string | null; // content-desc (Android) o label (iOS)
  texto: string | null; // text (Android) o value/label (iOS)

  // Geometría
  bounds: Bounds;

  // Estado
  habilitado: boolean;
  visible: boolean;
  clickable: boolean;
  scrollable: boolean;
  enfocado: boolean;
  esCampoTexto: boolean;
  sensible: boolean; // password=true (Android) o SecureTextField (iOS)

  // Plataforma específica (opcional)
  paquete: string | null; // Android only
  platform: "android" | "ios";

  // Contexto (SDD 6.2): ancestros y descendientes cercanos
  ancestros: number[]; // máximo 3 índices
  descendientes: number[]; // máximo 8 índices
  etiquetaCercana: string | null; // texto o descripción de elemento cercano
  etiquetaPosicion: "arriba" | "abajo" | "izquierda" | "derecha" | null; // relativo a este nodo

  // Metadatos
  profundidad: number; // 0 = root
  rolInferido: string | null; // "botón", "campo", "lista", etc. (inferido de clase)
}

export interface ArbolNormalizado {
  nodos: NodoNormalizado[];
  width: number;
  height: number;
  rotacion: number;
  timestamp: number; // ms desde epoch
  actividadActual?: string;
  platform: "android" | "ios";
}

export interface Contexto {
  ancestros: NodoNormalizado[];
  descendientes: NodoNormalizado[];
  hermanos: NodoNormalizado[];
}

// SDD 6.2: inferencia de rol por clase
export const rolesAndroid: Record<string, string> = {
  "android.widget.Button": "botón",
  "android.widget.EditText": "campo-texto",
  "android.widget.TextView": "texto",
  "android.widget.ImageView": "imagen",
  "android.widget.ImageButton": "botón-imagen",
  "android.widget.CheckBox": "checkbox",
  "android.widget.RadioButton": "radio",
  "android.widget.Switch": "switch",
  "android.widget.Spinner": "spinner",
  "android.widget.ProgressBar": "progreso",
  "android.widget.SeekBar": "slider",
  "android.widget.RatingBar": "rating",
  "android.widget.ListView": "lista",
  "android.widget.RecyclerView": "lista",
  "android.widget.ScrollView": "scroll",
  "android.widget.HorizontalScrollView": "scroll-horizontal",
  "android.widget.WebView": "webview",
  "androidx.compose.ui.platform.ComposeView": "compose-root",
};

export const rolesIOS: Record<string, string> = {
  UIButton: "botón",
  UITextField: "campo-texto",
  UITextView: "texto-editable",
  UILabel: "texto",
  UIImageView: "imagen",
  UISwitch: "switch",
  UIPicker: "picker",
  UIPickerView: "lista-picker",
  UITableView: "tabla",
  UICollectionView: "colección",
  UIScrollView: "scroll",
  UIWebView: "webview",
  WKWebView: "webview",
};
