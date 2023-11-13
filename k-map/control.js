class Petrick {
    constructor(minterms, maxterms, dontCares, dimension, variableNames, returnName) {
        this.minterms = minterms;
        this.maxterms = maxterms;
        this.dontCares = dontCares;
        this.dimension = dimension;
        this.variableNames = variableNames;
        this.returnName = returnName;
    }
    getMinterms() { return this.minterms; }
    getDontCares() { return this.dontCares; }
    getMaxterms() { return this.maxterms; }
    getDimension() { return this.dimension; }
    getVariableNames() { return this.variableNames; }
    getReturnName() { return this.returnName; }
    setMinterms(minterms) { this.minterms = minterms; }
    setMaxterms(maxterms) { this.maxterms = maxterms; }
    setDontCares(dontCares) { this.dontCares = dontCares; }
    setDimension(dimension) { this.dimension = dimension; }
    setVariableNames(variableNames) { this.variableNames = variableNames; }
    setReturnName(returnName) { this.returnName = returnName; }
    calculateSOPEssentials() {
        let allTerms = this.minterms.concat(this.dontCares);
        this.sopEssentials = new Array();
        let groups = this.groupTerms(allTerms, true);
        let reducedGroups = this.reduceGroupedTerms(groups, true).slice(0, -1);
        let primeImplicants = this.getPrimeImplicants(reducedGroups);
        let columns = this.getColumns(primeImplicants, true);
        let reducedColumns = this.reduceColumns(columns);
        this.sopEssentials = this.sopEssentials.concat(this.getEssentialImplicants(reducedColumns));
    }
    calculatePOSEssentials() {
        let allTerms = this.maxterms.concat(this.dontCares);
        this.posEssentials = new Array();
        let groups = this.groupTerms(allTerms, false);
        let reducedGroups = this.reduceGroupedTerms(groups, false).slice(0, -1);
        let primeImplicants = this.getPrimeImplicants(reducedGroups);
        let columns = this.getColumns(primeImplicants, false);
        let reducedColumns = this.reduceColumns(columns);
        this.posEssentials = this.posEssentials.concat(this.getEssentialImplicants(reducedColumns));
    }
    getSOPEssentials() {
        let essArr = new Array();
        for (let t of this.sopEssentials) {
            essArr.push(t.getTerms());
        }
        return essArr;
    }
    getPOSEssentials() {
        let essArr = new Array();
        for (let t of this.posEssentials) {
            essArr.push(t.getTerms());
        }
        return essArr;
    }
    getSOPGeneric() {
        let output = this.returnName + "(" + this.variableNames.join(", ") + ") = ";
        if (this.sopEssentials.length == 0)
            return output + "0";
        if (this.sopEssentials.length == 1 && (this.sopEssentials[0].getBinaryRep() == "-".repeat(this.dimension)))
            return output + "1";
        for (let e of this.sopEssentials) {
            let entryString = e.getBinaryRep();
            for (let i = 0; i < entryString.length; i++) {
                let c = entryString[i];
                if (c == "0")
                    output += this.variableNames[i] + '\'';
                else if (c == "1")
                    output += this.variableNames[i];
            }
            output += " + ";
        }
        return output.slice(0, -3);
    }
    getPOSGeneric() {
        let output = `${this.returnName}(${this.variableNames.join(", ")}) = `;
        if (this.posEssentials.length == 0)
            return output + "1";
        if (this.posEssentials.length == 1 && (this.posEssentials[0].getBinaryRep() == "-".repeat(this.dimension)))
            return output + "0";
        for (let e of this.posEssentials) {
            output += "(";
            let entryString = e.getBinaryRep();
            for (let i = 0; i < entryString.length; i++) {
                let c = entryString[i];
                if (c == "0")
                    output += this.variableNames[i] + " + ";
                else if (c == "1")
                    output += this.variableNames[i] + '\' + ';
            }
            output = output.slice(0, -3) + ")";
        }
        return output;
    }
    getSOPVhdl() {
        let output = this.returnName + " <= ";
        if (this.sopEssentials.length == 0)
            return output + "0;";
        else if (this.sopEssentials.length == 1 && (this.sopEssentials[0].getBinaryRep() == "-".repeat(this.dimension)))
            return output + "1;";
        output += "(";
        for (let e of this.sopEssentials) {
            let entryString = e.getBinaryRep();
            for (let i = 0; i < entryString.length; i++) {
                let c = entryString[i];
                let varName = this.variableNames[i];
                if (c == "0")
                    output += "not " + varName + " and ";
                else if (c == "1")
                    output += varName + " and ";
            }
            output = output.slice(0, -5) + ") or (";
        }
        output = output.slice(0, -5) + ";";
        return output;
    }
    getPOSVhdl() {
        let output = `${this.returnName} <= `;
        if (this.posEssentials.length == 0)
            return output + "1;";
        if (this.posEssentials.length == 1 && (this.posEssentials[0].getBinaryRep() == "-".repeat(this.dimension)))
            return output + "0;";
        for (let e of this.posEssentials) {
            output += "(";
            let entryString = e.getBinaryRep();
            for (let i = 0; i < entryString.length; i++) {
                let c = entryString[i];
                if (c == "0")
                    output += this.variableNames[i] + ' or ';
                else if (c == "1")
                    output += 'not ' + this.variableNames[i] + ' or ';
            }
            output = output.slice(0, -4) + ") and ";
        }
        return output.slice(0, -5) + ";";
    }
    getSOPVerilog() {
        let output = "assign " + this.returnName + " = ";
        if (this.sopEssentials.length == 0)
            return output + "0;";
        else if (this.sopEssentials.length == 1 && (this.sopEssentials[0].getBinaryRep() == "-".repeat(this.dimension)))
            return output + "1;";
        output += "(";
        for (let e of this.sopEssentials) {
            let entryString = e.getBinaryRep();
            for (let i = 0; i < entryString.length; i++) {
                let c = entryString[i];
                let varName = this.variableNames[i];
                if (c == "0")
                    output += "~" + varName + " & ";
                else if (c == "1")
                    output += varName + " & ";
            }
            output = output.slice(0, -3) + ") | (";
        }
        output = output.slice(0, -4) + ";";
        return output;
    }
    getPOSVerilog() {
        let output = "assign " + this.returnName + " = ";
        if (this.posEssentials.length == 0)
            return output + "1;";
        else if (this.posEssentials.length == 1 && (this.posEssentials[0].getBinaryRep() == "-".repeat(this.dimension)))
            return output + "0;";
        output += "(";
        for (let e of this.posEssentials) {
            let entryString = e.getBinaryRep();
            for (let i = 0; i < entryString.length; i++) {
                let c = entryString[i];
                let varName = this.variableNames[i];
                if (c == "0")
                    output += varName + " | ";
                else if (c == "1")
                    output += "~" + varName + " | ";
            }
            output = output.slice(0, -3) + ") & (";
        }
        output = output.slice(0, -4) + ";";
        return output;
    }
    groupTerms(terms, sop) {
        let groups = this.createGroupsArray();
        for (let i = 0; i < terms.length; i++) {
            let term = terms[i];
            let num1s = this.numberOf(term, sop);
            groups[num1s].push(new TableEntry([term], this.dimension));
        }
        return groups;
    }
    reduceGroupedTerms(groupedTerms, sop) {
        let groups = this.createGroupsArray();
        let mergedEntries = this.createGroupsArray();
        let cont = false;
        for (let i = 0; i < groupedTerms.length - 1; i++) {
            for (let j = i + 1; j < groupedTerms.length; j++) {
                for (let k = 0; k < groupedTerms[i].length; k++) {
                    for (let l = 0; l < groupedTerms[j].length; l++) {
                        let merged = false;
                        let t1 = groupedTerms[i][k];
                        let t2 = groupedTerms[j][l];
                        merged = this.checkTableEntries(t1, t2, groups, sop);
                        if (merged) {
                            mergedEntries[i].push(t1);
                            mergedEntries[j].push(t2);
                        }
                        cont = cont || merged;
                    }
                }
            }
        }
        for (let i = 0; i < groups.length; i++) {
            groups[i] = groups[i].filter(function (filtVal, filtIndex) {
                let otherIndex = groups[i].findIndex(function (findVal, findIndex) {
                    let repeatValue = findVal.getBinaryRep() == filtVal.getBinaryRep();
                    return repeatValue;
                });
                return filtIndex == otherIndex;
            });
            groupedTerms[i] = groupedTerms[i].filter(function (val, index) {
                return (mergedEntries[i].indexOf(val) == -1);
            });
        }
        if (cont)
            return [groupedTerms].concat(this.reduceGroupedTerms(groups, sop));
        else
            return [groupedTerms].concat([groups]);
    }
    getPrimeImplicants(reducedGroups) {
        let primeImplicants = new Array();
        for (let i = 0; i < reducedGroups.length; i++) {
            for (let j = 0; j < reducedGroups[i].length; j++) {
                primeImplicants = primeImplicants.concat(reducedGroups[i][j]);
            }
        }
        return primeImplicants;
    }
    getColumns(primeImplicants, sop) {
        let columns = new Map();
        let essentials = new Array();
        let terms = sop ? this.minterms : this.maxterms;
        for (let i = 0; i < terms.length; i++) {
            columns.set(terms[i], new Array());
        }
        terms.forEach(function (term, index) {
            columns.set(term, primeImplicants.filter(function (implicant, index) {
                return (implicant.getTerms().indexOf(term) != -1);
            }).map((implicant) => ([implicant])));
        });
        for (let [key, value] of columns) {
            if (value.length === 1) {
                terms = terms.filter((v) => (v != key));
                essentials.push(value[0][0]);
                for (let k of value[0][0].getTerms())
                    columns.delete(k);
            }
        }
        let columnArr = new Array();
        columns.forEach(function (value, key) {
            columnArr.push(value.filter(v => (essentials.indexOf(v[0]) < 0)));
        });
        if (sop) {
            this.sopEssentials = essentials;
        }
        else {
            this.posEssentials = essentials;
        }
        return columnArr;
    }
    reduceColumns(columns) {
        if (columns.length <= 1)
            return columns;
        let column1 = columns[0];
        let column2 = columns[1];
        let newColumn = new Array();
        for (let i = 0; i < column1.length; i++) {
            for (let j = 0; j < column2.length; j++) {
                let temp = column1[i].concat(column2[j]);
                temp = temp.filter(function (value, index) {
                    return (temp.indexOf(value) === index);
                });
                newColumn.push(temp);
            }
        }
        newColumn = this.simplifyColumn(newColumn);
        let newColumns = [newColumn].concat(columns.slice(2));
        if (newColumns.length > 1)
            return this.reduceColumns(newColumns);
        else
            return newColumns;
    }
    getEssentialImplicants(reducedColumns) {
        let options = reducedColumns[0];
        if (options != undefined && options.length > 0) {
            options = options.sort((a, b) => (a.length - b.length));
            return options[0];
        }
        else
            return [];
    }
    simplifyColumn(column) {
        let returnColumn;
        returnColumn = column.filter(function (value, index) {
            return (column.indexOf(value) == index);
        });
        for (let i = 0; i < returnColumn.length - 1; i++) {
            for (let j = i + 1; j < returnColumn.length; j++) {
                if (this.matchesIdentity(returnColumn[i], returnColumn[j])) {
                    returnColumn = returnColumn.slice(0, j).concat(returnColumn.slice(j + 1));
                }
                else if (this.matchesIdentity(returnColumn[j], returnColumn[i])) {
                    returnColumn = returnColumn.slice(0, i).concat(returnColumn.slice(i + 1));
                }
            }
        }
        return returnColumn;
    }
    matchesIdentity(x, xy) {
        for (let t of x) {
            if (xy.indexOf(t) < 0)
                return false;
        }
        return true;
    }
    numberOf(val, ones) {
        let ret = 0;
        while (val) {
            ret += (val & 1);
            val = val >> 1;
        }
        ret = (ones) ? ret : this.dimension - ret;
        return ret;
    }
    charInString(s, ones) {
        return ones ? (s.match(/1/g) || []).length : (s.match(/0/g) || []).length;
    }
    createGroupsArray() {
        let nGroups = this.dimension + 1;
        let groups = new Array(nGroups);
        for (let i = 0; i < groups.length; i++)
            groups[i] = new Array();
        return groups;
    }
    checkTableEntries(t1, t2, groups, sop) {
        if (t1.isAdjacent(t2)) {
            let t3 = t1.mergeEntry(t2);
            let num1s = this.charInString(t3.getBinaryRep(), sop);
            groups[num1s].push(t3);
            return true;
        }
        return false;
    }
}
class TableEntry {
    constructor(terms, dimension, binaryRepresentation = undefined) {
        this.terms = terms;
        this.dim = dimension;
        if (binaryRepresentation != undefined)
            this.binRep = binaryRepresentation;
        else if (terms.length === 0)
            this.binRep = "";
        else {
            let t1 = this.generateBinaryRep(this);
            this.binRep = t1.getBinaryRep();
        }
    }
    setTerms(terms) {
        this.terms = terms;
    }
    addTerms(terms) {
        this.setTerms(this.terms.concat(terms));
        this.removeRepeatedTerms();
        this.setTerms(this.sortByGrayCode(this.getTerms()));
    }
    getTerms() {
        return this.terms;
    }
    setBinaryRep(binaryRepresentation) {
        this.binRep = binaryRepresentation;
    }
    getBinaryRep() {
        return this.binRep;
    }
    setDimension(dim) {
        this.dim = dim;
    }
    getDimension() {
        return this.dim;
    }
    generateBinaryRep(t) {
        let pow = Math.log(this.terms.length) / Math.log(2);
        if (!(pow === parseInt(pow.toString(10), 10))) {
            this.setBinaryRep(undefined);
            return undefined;
        }
        let terms = t.getTerms();
        terms = this.sortByGrayCode(terms);
        let dimension = t.getDimension();
        let currBinRep = t.getBinaryRep();
        if (terms.length === 1)
            return new TableEntry([terms[0]], dimension, this.numberToBinary(terms[0]));
        else if (t.getTerms().length == 2) {
            let t1 = new TableEntry([terms[0]], dimension, this.numberToBinary(terms[0]));
            let t2 = new TableEntry([terms[1]], dimension, this.numberToBinary(terms[1]));
            let t3 = t1.mergeEntry(t2);
            return t3;
        }
        else {
            let halfwayPoint = Math.floor(terms.length / 2);
            let firstHalf = new TableEntry(terms.slice(0, halfwayPoint), dimension, currBinRep);
            let secondHalf = new TableEntry(terms.slice(halfwayPoint), dimension, currBinRep);
            let t1 = this.generateBinaryRep(firstHalf);
            let t2 = this.generateBinaryRep(secondHalf);
            let t3 = t1.mergeEntry(t2);
            return t3;
        }
    }
    numberToBinary(num) {
        if (num >= Math.pow(2, this.dim) || num < 0)
            return undefined;
        let s = num.toString(2);
        s = Array(this.dim - s.length + 1).join("0") + s;
        return s;
    }
    mergeEntry(t2) {
        let mismatches = this.findMismatches(t2.getBinaryRep());
        let newEntry = new TableEntry(this.getTerms(), this.getDimension(), this.getBinaryRep());
        if (mismatches.length === 0) {
            newEntry.setTerms(this.terms.concat(t2.terms));
            newEntry.removeRepeatedTerms();
            return newEntry;
        }
        else if (mismatches.length === 1) {
            let newBinRep = newEntry.getBinaryRep();
            newBinRep = this.replaceAt(newBinRep, mismatches[0], "-");
            newEntry.setBinaryRep(newBinRep);
            newEntry.addTerms(t2.getTerms());
            return newEntry;
        }
        else {
            return undefined;
        }
    }
    isAdjacent(t2) {
        return (this.findMismatches(t2.getBinaryRep()).length <= 1);
    }
    findMismatches(rep) {
        let mismatches = new Array();
        for (let i = 0; i < this.binRep.length; i++) {
            if (this.binRep[i] != rep[i]) {
                mismatches.push(i);
            }
        }
        return mismatches;
    }
    removeRepeatedTerms() {
        let newTerms = this.terms.filter(function (elem, index, self) {
            return index == self.indexOf(elem);
        });
        this.setTerms(newTerms);
    }
    replaceAt(value, index, replacement) {
        return value.substr(0, index) + replacement + value.substr(index + replacement.length);
    }
    sortByGrayCode(terms) {
        return terms.sort((a, b) => (this.grayCodeLocation(a) - this.grayCodeLocation(b)));
    }
    grayCodeLocation(num) {
        let mask = num >> 1;
        while (mask != 0) {
            num = num ^ mask;
            mask = mask >> 1;
        }
        return num;
    }
}
