/*
 * Knowage, Open Source Business Intelligence suite
 * Copyright (C) 2018 Engineering Ingegneria Informatica S.p.A.
 *
 * Knowage is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Knowage is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

package it.eng.spagobi.tools.dataset.solr;

import org.apache.log4j.Logger;

abstract class JsonFacet {

    private static final Logger logger = Logger.getLogger(JsonFacet.class);

    protected final String type = "terms";
    protected String field;
    protected int limit = 10;

    public JsonFacet(String field) {
        this.field = field;

    }

    public JsonFacet(String field, int limit) {
        this.field = field;
        this.limit = limit;
    }

    public String getType() {
        return type;
    }

    public String getField() {
        return field;
    }

	public int getLimit() {
		return limit;
	}

	public void setLimit(int limit) {
		this.limit = limit;
	}


}
