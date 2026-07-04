
    export class DataCache {
        _data;
        _timeAdd;
        _timeUpdate;
        _timeAccess;
        _timeExpire = 0;
        constructor(data, timeExp = 0) {
            this._data = data;
            this._timeAdd = Date.now();
            this._timeUpdate = undefined;
            this._timeAccess = undefined;
            this._timeExpire = timeExp;
        }

        get data() {
            this._timeAccess = Date.now();
            return this._data;
        }
        get timeAdd() { return this._timeAdd; }
        get timeUpdate() { return this._timeUpdate; }
        get timeAccess() { return this._timeAccess; }
        get timeExpire() { return this._timeExpire; }
        get hasExpired() { return this._timeExpire > 0 && this._timeExpire < Date.now() }

        set timeExpire(value) {
            if (typeof value !== "number" || value < 0) return;
            this._timeExpire = value;
        }

        update(data, expTime = -1) {
            this._data = data;
            this._timeUpdate = Date.now();
            this.timeExpire = expTime;
        }
    }

    export class DataCacheStorage {
        static #activeStorages = {}
        _name;
        _maxSize;
        _autoSave;
        _dropExpired;
        _dataMap;

        get #head() { return this._dataMap["-head"]; }
        get #tail() { return this._dataMap["-tail"]; }

        get name() { return this._name; }
        get maxSize() { return this._maxSize; }
        get autoSave() { return this._autoSave; }
        get dropExpired() { return this._dropExpired; }

        /**
         * @param value {string}
         */
        set name(value) {
            if (typeof value !== "string") throw new Error("Invalid Storage Name");
            this._name = value;
        }

        /**
         * @param value {number}
         */
        set maxSize(value) {
            if (typeof value !== "number" || value <= 0) return;
            this._maxSize = value;
        }

        /**
         * @param value {boolean}
         */
        set autoSave(value) {
            if (typeof value !== "boolean") return;
            this._autoSave = value;
        }

        /**
         * @param value {boolean}
         */
        set dropExpired(value) {
            if (typeof value !== "boolean") return;
            this._dropExpired = value;
        }

        /**
         * 不要在外部调用该构造器，请使用CacheStorage.open()
         */
        constructor(name, maxSize = 128, dropExpired = false, autoSave = true) {
            this.name = name;
            this._dataMap = {
                "-head": { next: "-tail", prev: null },
                "-tail": { next: null, prev: "-head" }
            };
            this.maxSize = maxSize;
            this.dropExpired = dropExpired;
            this.autoSave = autoSave;
        }

        static fromObject(obj, name) {
            if (!obj._name) return new DataCacheStorage(name);
            let storage = Object.assign(new DataCacheStorage(name), obj);
            for (const keyX in storage._dataMap) {
                let node = storage._dataMap[keyX];
                let cache = node.cache;
                if (cache) {
                    cache = Object.assign(new DataCache(null, -1), cache);
                    node.cache = cache;
                }
            }
            return storage;
        }

        /**
         * 打开指定的缓存库，若库不存在则会新建。可通过额外参数指定或覆盖缓存库设置
         * @param storageName {string} 库名称
         * @param maxSize {number} 最大缓存记录条数
         * @param dropExpired {boolean} 是否删除过期记录
         * @param autoSave {boolean} 是否自动保存
         * @param replaceProp {boolean} 如果库已存在，是否使用设置的值替换原有设置
         * @returns {DataCacheStorage} 名称对应的存储库
         */
        static open(storageName, maxSize = undefined, dropExpired = undefined, autoSave = undefined, replaceProp = false) {
            if (!(storageName in this.#activeStorages)) {
                this.#activeStorages[storageName] = DataCacheStorage.fromObject(GM_getValue(`cache_${storageName}`, new DataCacheStorage(storageName, maxSize, dropExpired, autoSave)), storageName);
            }
            let storage = this.#activeStorages[storageName];

            if (replaceProp) {
                storage.maxSize = maxSize;
                storage.dropExpired = dropExpired;
                storage.autoSave = autoSave;
            }

            if (storage.dropExpired) {
                storage.dropExpiredCache();
            }

            return this.#activeStorages[storageName];
        }

        static dropStorage(storageName) {
            if (storageName in this.#activeStorages) {
                delete this.#activeStorages[storageName];
            }
            GM_deleteValue(`cache_${storageName}`);
        }

        /**
         * 保存缓存库至持久化存储
         */
        save() {
            GM_setValue(`cache_${this.name}`, this);
        }

        #disconnectNode(node) {
            if (node.next) this._dataMap[node.next].prev = node.prev;
            if (node.prev) this._dataMap[node.prev].next = node.next;

            node.next = null;
            node.prev = null;
        }

        #moveNodeNextTo(key, node, prevKey) {
            let keyX = "_" + key;
            let prevKeyX = prevKey ? "_" + prevKey : "-head";
            this.#disconnectNode(node);

            node.prev = prevKeyX;
            node.next = this._dataMap[prevKeyX].next;
            this._dataMap[prevKeyX].next = keyX;
            this._dataMap[node.next].prev = keyX;
        }

        #moveNodeBefore(key, node, nextKey) {
            let keyX = "_" + key;
            let nextKeyX = nextKey ? "_" + nextKey : "-tail";
            this.#disconnectNode(node);

            node.next = nextKeyX;
            node.prev = this._dataMap[nextKeyX].prev;
            this._dataMap[nextKeyX].prev = keyX;
            this._dataMap[node.prev].next = keyX;
        }

        #sizeLimitCheck() {
            let overflow = Object.keys(this._dataMap).length - 2 - this.maxSize;
            for (let i = 0; i < overflow; i++) {
                if (this.#head.next === "-tail") break;
                this.drop(this.#head.next);
            }
        }

        #isExpired(key) {
            let keyX = "_" + key;
            if (!(keyX in this._dataMap)) return true;
            let cache = this._dataMap[keyX].cache;
            let expired = cache.hasExpired;

            if (expired && this.dropExpired) this.drop(key);
            return expired;
        }

        /**
         * 提交或新增对缓存记录的更改
         * @param key {string}
         * @param data {*}
         * @param expTime {number} 过期时间（毫秒数），为-1则不修改
         */
        commit(key, data, expTime = -1) {
            let keyX = "_" + key;
            let node = this._dataMap[keyX];
            if (node) {
                node.cache.update(data, expTime);
            } else {
                node = {
                    cache: new DataCache(data, expTime),
                    next: null,
                    prev: null
                };
                this._dataMap[keyX] = node;
                this.#sizeLimitCheck();
            }
            this.#moveNodeBefore(key, node, null);

            if (this.autoSave) this.save();
        }

        /**
         * 删除指定key对应的缓存记录
         * @param key {string}
         */
        drop(key) {
            let keyX = "_" + key;
            if (!(keyX in this._dataMap)) return;
            this.#disconnectNode(this._dataMap[keyX])
            delete this._dataMap[keyX];

            if (this.autoSave) this.save();
        }

        /**
         * 删除所有过期的缓存记录
         */
        dropExpiredCache() {
            for (let keyX in this._dataMap) {
                if (keyX.startsWith("-")) continue;
                let node = this._dataMap[keyX];
                if (!node.cache.hasExpired) continue;

                this.drop(keyX.substring(1));
            }
        }

        /**
         * 获取指定缓存记录的数据
         * @param key {string}
         * @returns {*}
         */
        get(key) {
            let keyX = "_" + key;
            let value;
            if (keyX in this._dataMap && !this.#isExpired(key)) {
                this.#moveNodeBefore(key, this._dataMap[keyX], null);
                value = this._dataMap[keyX].cache.data;
            }

            if (this.autoSave) this.save();
            return value;
        }

        /**
         * 获取key对应的缓存对象（包含添加、修改、访问时间信息），注意该方法不会触发自动保存。
         * @param key {string}
         * @param keepExpired {boolean} 是否返回已过期的缓存记录？（如果缓存已删除，如设置了dropExpired为true，则无法获取到对象）
         * @returns {DataCache}
         */
        getCache(key, keepExpired) {
            let keyX = "_" + key;
            let value;
            if (keyX in this._dataMap && (keepExpired || !this.#isExpired(key))) {
                this.#moveNodeBefore(key, this._dataMap[keyX], null);
                value = this._dataMap[keyX].cache;
            }

            //if(this.autoSave) this.save();
            return value;
        }
    }
