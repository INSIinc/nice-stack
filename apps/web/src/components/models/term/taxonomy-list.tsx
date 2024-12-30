import React, { useContext, useMemo, useEffect, useState } from 'react';
import { api } from "@nicestack/client";
import { TermEditorContext } from './term-editor';
import { Button, theme } from 'antd';

const TaxonomyList: React.FC = () => {
    const { token } = theme.useToken()
    const { data: taxonomies, isLoading } = api.taxonomy.getAll.useQuery({});
    const { taxonomyId, taxonomyName, setTaxonomyName, setTaxonomyId, setTaxonomyModalOpen } = useContext(TermEditorContext)
    useEffect(() => {
        if (!taxonomyId && taxonomies && taxonomies.length > 0) {
            setTaxonomyId(taxonomies[0]?.id)
            setTaxonomyName(taxonomies[0]?.name)
        }
    }, [taxonomies])
    return (
        <div className='flex flex-col w-1/6  border-r'>
            <div className=' flex justify-between  items-center gap-4 p-2 border-b' style={{ height: 49 }}>
                <span className='text-primary'> 分类法列表</span>
                <Button type='primary' ghost onClick={() => {
                    setTaxonomyModalOpen(true)
                }}>创建分类法</Button>
            </div>
            <div className='flex flex-col'>
                {taxonomies?.map((item) => (
                    <div
                        style={{
                            background: item.id === taxonomyId ? token.colorPrimaryBg : ""
                        }}
                        key={item.id} onClick={() => {
                            setTaxonomyId(item.id)
                            setTaxonomyName(item?.name)
                        }} className={`flex items-center  ${item.id === taxonomyId ? " text-primary border-l-4 border-primaryHover" : ""}  gap-4 p-2 hover:bg-textHover transition-all ease-in-out`}>
                        <div className=''>
                            <span>{item.name}</span>
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
};

export default TaxonomyList;
