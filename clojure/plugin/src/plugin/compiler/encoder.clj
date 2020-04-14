(ns plugin.compiler.encoder
  (:require [plugin.utils.conversions :refer :all]
            [plugin.compiler.emitter :as emit]))

(defn variable-size
  "Return the number of bytes necessary to encode this variable.
	If the value is negative or float then the size is 4 bytes. Also, the
	max number of bytes is 4."
  [value]
  (if (or (float? value) (neg? value))
    4
    (or (first (filter (fn [size] (< value (Math/pow 2 (* 8 size))))
                       [1 2 3 4]))
        4)))

(defn sort-globals [program]
  (let [sorted-globals (sort-by (fn [{:keys [value]}] [value (variable-size value)])
                                (fn [[a-value a-size] [b-value b-size]]
                                  (if (= a-size b-size)
                                    (< a-value b-value)
                                    (< a-size b-size)))
                                (:globals program))]
    (assoc program :sorted-globals (vec sorted-globals))))

(def default-globals (map emit/constant [0 1 -1]))

(defn all-globals [{globals :sorted-globals}]
  (concat default-globals
          (filter (complement (set default-globals))
                  globals)))

(defn index-of-constant [globals value]
  (.indexOf globals (emit/constant value)))

(defn encode-globals [globals]
  (let [to-encode (filter (complement (set (map :value default-globals)))
                          (map :value globals))
        groups (group-by variable-size to-encode)
        encode-global (fn [value size]
                        (let [actual-value (if (= 4 size)
                                             (float->uint32 value)
                                             value)]
                          (map (fn [n]
                                 (bit-and (bit-shift-right actual-value
                                                           (* 8 n))
                                          16rFF))
                               (range (dec size) -1 -1))))
        encode-group-size (fn [size group]
                            (bit-or (bit-shift-left (count group) 2)
                                    (dec size)))]
    (concat [(count to-encode)]
            (mapcat (fn [size]
                      (mapcat (fn [partition]
                                (concat [(encode-group-size size partition)]
                                        (mapcat #(encode-global % size)
                                                partition)))
                              (partition-all 2r111111 (groups size))))
                    [1 2 3 4]))))

(defn encode-script-header
  [{:keys [arguments delay locals running?]} globals]
  (let [has-delay? (> (:value delay) 0)
        has-arguments? (not (empty? arguments))
        has-locals? (not (empty? locals))]
    (concat
            ; First byte:
  		      ; 1 bit : isTicking (1 true / 0 false)
  		      ; 1 bit: hasDelay (1 true / 0 false)
  		      ; 1 bit: hasArguments (1 true / 0 false)
  		      ; 1 bit: hasLocals (1 true / 0 false)
  		      ; 4 bits: reserved for future use
            [(bit-and (bit-or (bit-shift-left (if running? 1 0) 7)
                              (bit-shift-left (if has-delay? 1 0) 6)
                              (bit-shift-left (if has-arguments? 1 0) 5)
                              (bit-shift-left (if has-locals? 1 0) 4))
                      16rFF)]

            ; If the script has a delay write its index on the global list
            (if has-delay?
              [(index-of-constant globals (:value delay))]
              [])

            ; TODO(Richo): Arguments!

            ; If the script has locals write the local count followed by
            ; each local index on the global list
            (if has-locals?
              (concat [(count locals)]
                      (map #(index-of-constant globals (:value %))
                           locals))
              []))))

(defmulti encode-instruction (fn [instr script program] (:__class__ instr)))

(defmethod encode-instruction "UziPauseScriptInstruction"
  [instr script program]
  (let [index (.indexOf (map :name (:scripts program))
                        (:argument instr))]
    (if (> index 16r7F)
      (throw (ex-info "Not implemented yet!" {:instruction instr
                                              :script script
                                              :program program}))
      (if (> index 16r7)
        [16rFE (bit-or 16r80 index)]
        [(bit-or 16rE8 index)]))))

(defmethod encode-instruction "UziStopScriptInstruction"
  [instr script program]
  (let [index (.indexOf (map :name (:scripts program))
                        (:argument instr))]
    (if (> index 16r7F)
      (throw (ex-info "Not implemented yet!" {:instruction instr
                                              :script script
                                              :program program}))
      (if (> index 16r7)
        [16rFE index]
        [(bit-or 16rE0 index)]))))

(defmethod encode-instruction "UziResumeScriptInstruction"
  [instr script program]
  (let [index (.indexOf (map :name (:scripts program))
                        (:argument instr))]
    (if (> index 16r7F)
      (throw (ex-info "Not implemented yet!" {:instruction instr
                                              :script script
                                              :program program}))
      (if (> index 16r7)
        [16rFD (bit-or 16r80 index)]
        [(bit-or 16rD8 index)]))))

(defmethod encode-instruction "UziStartScriptInstruction"
  [instr script program]
  (let [index (.indexOf (map :name (:scripts program))
                        (:argument instr))]
    (if (> index 16r7F)
      (throw (ex-info "Not implemented yet!" {:instruction instr
                                              :script script
                                              :program program}))
      (if (> index 16r7)
        [16rFD index]
        [(bit-or 16rD0 index)]))))

(defmethod encode-instruction :default [o _ _]
  (println "Error: MISSING ENCODE FUNCTION")
  (prn o)
  [])

(defn encode-instructions [instructions script program]
  (concat [(count instructions)]
          (mapcat #(encode-instruction % script program) instructions)))

(defn encode-script
  [{:keys [instructions] :as script} program]
  (concat (encode-script-header script (all-globals program))
          (encode-instructions instructions script program)))

(defn encode-program [{:keys [scripts sorted-globals] :as program}]
  (concat [(count scripts)]
          (encode-globals sorted-globals)
          (mapcat (fn [script]
                    (encode-script script program))
                  scripts)))

(defn encode [program]
  (-> program
      sort-globals
      encode-program
      vec))

#_(
   (def src "task main() {}")
   (def program (sort-globals (plugin.compiler.core/compile-uzi-string src)))
   program







   (all-globals program)
   (encode-globals (:sorted-globals program))
   (index-of-constant (all-globals program) 1000)
   (encode-script-header (get (:scripts program) 0) (all-globals program))
   (encode-program program)










   )