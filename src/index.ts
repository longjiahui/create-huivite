#!/usr/bin/env node

import { program } from 'commander'
import { input } from '@inquirer/prompts'
import { $, execa } from 'execa'
import fs from 'fs-extra'
import path from 'node:path'
import { source } from './source.js'

program.argument('<dir>').action(async (dir) => {
    const toDir = path.resolve(dir)
    const defaultName = path.basename(toDir).split(path.sep).pop()
    const projectName = await input({
        message: 'Project name',
        default: defaultName,
        required: true,
    })

    if (fs.existsSync(toDir)) {
        throw new Error('Directory already exists!')
    }

    const dbName = await input({
        message: 'Database name',
        default: defaultName,
        required: true,
    })

    const project = {
        name: projectName,
        version: '1.0.0',
        bin: './dist/index.js',
        type: 'commonjs',
        scripts: {
            dev: 'cross-env DEBUG=koa-router,server:* tsc-watch --onSuccess "node dist/index.js"',
            build: 'tsc',
            lint: 'tsc --noEmit',
        },
        keywords: [],
        author: [],
        license: 'ISC',
        description: '',
        dependencies: {},
        devDependencies: {},
    }

    await $`mkdir -p ${toDir}`
    await $`cd ${toDir}`

    fs.writeFileSync(
        path.join(toDir, 'package.json'),
        JSON.stringify(project, null, 2)
    )

    // 初始化文件
    await source('./base/**/*', './base').copyTo(toDir, {
        '.env': {
            dbName,
        },
    })

    // 进入toDIR cwd
    await execa({
        stdout: 'inherit',
        cwd: toDir,
    })`pnpm i koa-passport passport-github qs jsonwebtoken`
    await execa({
        stdout: 'inherit',
        cwd: toDir,
    })`pnpm i -D @types/jsonwebtoken @types/koa @types/koa-passport @types/koa-bodyparser @types/passport-github @types/qs tsc-watch typescript`
    // PRISMA 放最后，因为prisma install script可能会卡住，这个时候就少安装了依赖。
    await execa({
        stdout: 'inherit',
        cwd: toDir,
    })`pnpm i @anfo/huiserver prisma cross-env`
    await execa({ stdout: 'inherit', cwd: toDir })`pnpm prisma generate`
})
program.parse()
